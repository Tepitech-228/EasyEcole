import { createHash } from "crypto";
import { Request, Response } from "express";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { PersonnelAdministratif } from "../../auth/models/PersonnelAdministratif";
import { Enseignant } from "../../auth/models/Enseignant";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { PointageTerminal } from "../models/PointageTerminal";
import { PointageTerminalEvent } from "../models/PointageTerminalEvent";
import { Op } from "sequelize";
import PointageTerminalController from "./PointageTerminalController";
import PointageRealtimeService from "../services/PointageRealtimeService";

interface HikvisionPushEvent {
  employeeNoString: string;
  name: string;
  date: string;
  time: string;
  major: number;
  minor: number;
}

function normalizedIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

export function parseHikvisionPushEvent(body: unknown): HikvisionPushEvent | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const rawEvent = payload.AccessControllerEvent;
  if (!rawEvent || typeof rawEvent !== "object") return null;
  const event = rawEvent as Record<string, unknown>;
  const employeeNoString = typeof event.employeeNoString === "string" ? event.employeeNoString.trim() : "";
  const name = typeof event.name === "string" ? event.name.trim() : "";
  const rawTime = typeof event.time === "string" ? event.time.trim() : "";
  const timestamp = new Date(rawTime);
  const major = Number(event.major);
  const minor = Number(event.minor);

  if (
    !employeeNoString || employeeNoString.length > 64 ||
    name.length > 120 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(rawTime) ||
    !Number.isFinite(timestamp.getTime()) ||
    !Number.isSafeInteger(major) || major < 0 || major > 65535 ||
    !Number.isSafeInteger(minor) || minor < 0 || minor > 65535
  ) return null;

  const isoTime = timestamp.toISOString();
  return {
    employeeNoString,
    name,
    date: isoTime.slice(0, 10),
    time: isoTime.slice(11, 19),
    major,
    minor
  };
}

async function resolveUtilisateur(employeeNo: string, etablissementId: number): Promise<Utilisateur | null> {
  const [dossiers, siteUsers] = await Promise.all([
    DossierEtudiant.findAll({
      where: { matricule: employeeNo, etablissementId },
      attributes: ["utilisateurId"]
    }),
    SiteUtilisateur.findAll({ where: { etablissementId }, attributes: ["utilisateurId"] })
  ]);

  const siteUserIds = siteUsers.map(item => Number(item.utilisateurId));
  const [personnels, enseignants] = await Promise.all([
    PersonnelAdministratif.findAll({
      where: {
        matricule: employeeNo,
        [Op.or]: [
          { utilisateurId: { [Op.in]: siteUserIds } },
          { etablissementId }
        ]
      },
      attributes: ["utilisateurId"]
    }),
    Enseignant.findAll({
      where: { matricule: employeeNo, utilisateurId: { [Op.in]: siteUserIds } },
      attributes: ["utilisateurId"]
    })
  ]);
  const profileIds = new Set<number>([
    ...dossiers.map(item => Number(item.utilisateurId)),
    ...personnels.map(item => Number(item.utilisateurId)),
    ...enseignants.map(item => Number(item.utilisateurId))
  ].filter(id => Number.isSafeInteger(id) && id > 0));

  if (profileIds.size > 1) return null;
  if (profileIds.size === 1) return Utilisateur.findByPk(Array.from(profileIds)[0]);

  const identifiants = await Utilisateur.findAll({
    where: { identifiant: employeeNo },
    attributes: ["id"]
  });
  const matchingIds = new Set<number>(
    identifiants.map(item => Number(item.id)).filter(id => Number.isSafeInteger(id) && id > 0)
  );
  if (matchingIds.size === 1) return Utilisateur.findByPk(Array.from(matchingIds)[0]);
  if (matchingIds.size > 1) return null;

  if (/^\d+$/.test(employeeNo)) return Utilisateur.findByPk(Number(employeeNo));
  return null;
}

async function traiterEvenement(terminal: PointageTerminal, eventId: number): Promise<void> {
  try {
    const pendingEvent = await PointageTerminalEvent.findOne({
      where: { id: eventId, terminalId: terminal.id, statut: "en_attente" }
    });
    if (!pendingEvent) return;
    await terminal.update({ lastSeenAt: new Date() });
    const utilisateur = await resolveUtilisateur(pendingEvent.pin, Number(terminal.etablissementId));
    const log = {
      pin: pendingEvent.pin,
      date: pendingEvent.date,
      time: pendingEvent.heure,
      statusCode: pendingEvent.statusCode,
      verifyType: pendingEvent.verifyType,
      utilisateurId: utilisateur ? Number(utilisateur.id) : undefined,
      eventId: Number(pendingEvent.id)
    };
    const recorded = await PointageTerminalController.processAttendanceEvent(terminal, log);
    if (!utilisateur) return;

    if (!recorded.recorded) {
      // Refus (paiement non à jour, compte non autorisé, déjà traité…) : on
      // notifie tout de même l’application pour qu’elle annonce le refus.
      if (recorded.mode === "refuse") {
        PointageRealtimeService.emitTerminalAttendance({
          utilisateurId: Number(utilisateur.id),
          nom: utilisateur.nom,
          prenoms: utilisateur.prenoms,
          role: utilisateur.role,
          employeeNoString: pendingEvent.pin,
          date: pendingEvent.date,
          time: pendingEvent.heure,
          mode: "refuse",
          etablissementId: Number(terminal.etablissementId),
          motifRefus: recorded.motifRefus
        });
      }
      return;
    }

    PointageRealtimeService.emitTerminalAttendance({
      utilisateurId: Number(utilisateur.id),
      nom: utilisateur.nom,
      prenoms: utilisateur.prenoms,
      role: utilisateur.role,
      employeeNoString: pendingEvent.pin,
      date: pendingEvent.date,
      time: pendingEvent.heure,
      mode: recorded.mode,
      etablissementId: Number(terminal.etablissementId)
    });
  } catch (error) {
    console.error(`[Hikvision] Échec du traitement d’un événement du terminal ${terminal.id}:`, error);
  }
}

export default class HikvisionPushController {
  static async resumePendingEvents(): Promise<void> {
    let lastEventId = 0;
    while (true) {
      const pendingEvents = await PointageTerminalEvent.findAll({
        where: { statut: "en_attente", id: { [Op.gt]: lastEventId } },
        order: [["id", "ASC"]],
        limit: 100
      });
      if (pendingEvents.length === 0) return;
      for (const event of pendingEvents) {
        lastEventId = Number(event.id);
        const terminal = await PointageTerminal.findOne({
          where: { id: event.terminalId, protocol: "hikvision_isapi", actif: true }
        });
        if (!terminal) {
          console.error(`[Hikvision] Reçu en attente ${event.id}: aucun terminal actif correspondant.`);
          continue;
        }
        await traiterEvenement(terminal, Number(event.id));
      }
    }
  }

  static async receive(req: Request, res: Response): Promise<Response> {
    const event = parseHikvisionPushEvent(req.body);
    if (!event) {
      return res.status(400).type("text/plain").send("INVALID EVENT");
    }

    const remoteIp = normalizedIp(req.socket.remoteAddress || "");
    if (!remoteIp) return res.status(403).type("text/plain").send("FORBIDDEN");

    try {
      const terminals = await PointageTerminal.findAll({
        where: { protocol: "hikvision_isapi", sourceIp: remoteIp, actif: true }
      });
      if (terminals.length !== 1) {
        return res.status(403).type("text/plain").send("TERMINAL NOT AUTHORIZED");
      }
      const terminal = terminals[0];
      const fingerprint = createHash("sha256")
        .update([terminal.serialNumber, event.employeeNoString, event.date, event.time, event.major, event.minor].join("|"))
        .digest("hex");
      const [received, created] = await PointageTerminalEvent.findOrCreate({
        where: { fingerprint },
        defaults: {
          terminalId: Number(terminal.id),
          utilisateurId: null,
          etablissementId: Number(terminal.etablissementId),
          pointageId: null,
          pin: event.employeeNoString,
          date: event.date,
          heure: event.time,
          statusCode: event.major,
          verifyType: event.minor,
          statut: "en_attente",
          motifRefus: null,
          fingerprint
        }
      });
      if (Number(received.terminalId) !== Number(terminal.id)) {
        return res.status(409).type("text/plain").send("EVENT CONFLICT");
      }
      res.status(200).type("text/plain").send("OK");
      if (created || received.statut === "en_attente") {
        void traiterEvenement(terminal, Number(received.id));
      }
      return res;
    } catch (error) {
      console.error("[Hikvision] Échec de réception d’un événement push:", error);
      return res.status(503).type("text/plain").send("RETRY");
    }
  }
}
