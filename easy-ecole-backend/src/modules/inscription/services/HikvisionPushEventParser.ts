export interface HikvisionPushEvent {
  employeeNoString: string;
  name: string;
  date: string;
  time: string;
  major: number;
  minor: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toEventNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

/**
 * Le terminal envoie un heartbeat sur le meme endpoint que les evenements.
 * Il doit recevoir un 200, sinon il finit par considerer l'hote comme
 * indisponible et cesse de pousser les pointages.
 */
export function isHikvisionHeartbeat(body: unknown): boolean {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return /"eventType"\s*:\s*"heartBeat"/i.test(text) || /heartbeat/i.test(text);
}

/**
 * Extrait l'événement d'un push Hikvision.
 *
 * Deux formats sont rencontrés selon le firmware :
 * - multipart/form-data avec un champ texte `AccessControllerEvent` contenant
 *   le JSON complet (format observé sur DS-K1T342MFWX) ;
 * - ancien format avec un champ `event_log` (chaîne JSON ou objet).
 *
 * La date/heure de l'événement est conservée en heure locale du terminal
 * (celle portée par `dateTime`), et non convertie en UTC : le pointage doit
 * refléter l'heure de l'école.
 */
export function parseHikvisionPushEvent(body: unknown): HikvisionPushEvent | null {
  const outer = asRecord(body);
  if (!outer) return null;

  let payload = outer;

  // Format réellement envoyé par le terminal : le champ multipart
  // "AccessControllerEvent" arrive sous forme de chaîne JSON.
  if (typeof outer.AccessControllerEvent === "string") {
    try {
      const parsed = asRecord(JSON.parse(outer.AccessControllerEvent));
      if (!parsed) return null;
      payload = parsed;
    } catch {
      return null;
    }
  } else {
    const eventLog = outer.event_log;
    if (typeof eventLog === "string") {
      try {
        const parsed = asRecord(JSON.parse(eventLog));
        if (!parsed) return null;
        payload = parsed;
      } catch {
        return null;
      }
    } else {
      const eventLogRecord = asRecord(eventLog);
      if (eventLogRecord) payload = eventLogRecord;
    }
  }

  const event = asRecord(payload.AccessControllerEvent);
  if (!event) return null;

  const rawEmployeeNo = event.employeeNoString ?? event.employeeNo;
  const employeeNoString =
    typeof rawEmployeeNo === "string"
      ? rawEmployeeNo.trim()
      : typeof rawEmployeeNo === "number" && Number.isSafeInteger(rawEmployeeNo)
        ? String(rawEmployeeNo)
        : "";
  const name = typeof event.name === "string" ? event.name.trim() : "";
  const rawTime =
    typeof payload.dateTime === "string"
      ? payload.dateTime.trim()
      : typeof event.time === "string"
        ? event.time.trim()
        : "";
  const major = toEventNumber(event.major ?? event.majorEventType);
  const minor = toEventNumber(event.minor ?? event.subEventType);
  const timestamp = new Date(rawTime);
  const localTime = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/.exec(rawTime);

  if (
    !employeeNoString ||
    employeeNoString.length > 64 ||
    name.length > 120 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(rawTime) ||
    !localTime ||
    !Number.isFinite(timestamp.getTime()) ||
    !Number.isSafeInteger(major) ||
    major < 0 ||
    major > 65535 ||
    !Number.isSafeInteger(minor) ||
    minor < 0 ||
    minor > 65535
  ) {
    return null;
  }

  return {
    employeeNoString,
    name,
    date: localTime[1],
    time: localTime[2],
    major,
    minor
  };
}
