export const DELAI_GRACE_POINTAGE_SECONDES = 15 * 60;

function secondesDepuisHeure(value: unknown): number | null {
  const match = String(value ?? "").match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] || 0);
}

export function estDepartAnticipe(heureDepart: unknown, heureFinPrevue: unknown): boolean | null {
  const depart = secondesDepuisHeure(heureDepart);
  const finPrevue = secondesDepuisHeure(heureFinPrevue);
  if (depart === null || finPrevue === null) return null;
  return depart < finPrevue;
}

export function depasseDelaiGraceDepart(heureDepart: unknown, heureFinPrevue: unknown): boolean | null {
  const depart = secondesDepuisHeure(heureDepart);
  const finPrevue = secondesDepuisHeure(heureFinPrevue);
  if (depart === null || finPrevue === null) return null;
  return depart > finPrevue + DELAI_GRACE_POINTAGE_SECONDES;
}

export function depasseFenetreDebut(heurePointage: unknown, heureDebutPrevue: unknown): boolean | null {
  const pointage = secondesDepuisHeure(heurePointage);
  const debutPrevu = secondesDepuisHeure(heureDebutPrevue);
  if (pointage === null || debutPrevu === null) return null;
  return pointage < debutPrevu - DELAI_GRACE_POINTAGE_SECONDES;
}

export function validerMotifDepart(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const motif = value.trim();
  return motif.length > 0 && motif.length <= 500 ? motif : null;
}

function formaterHeure(value: unknown): string | null {
  const text = String(value ?? "");
  const match = text.match(/(?:^|T)([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/);
  return match ? `${match[1]}:${match[2]}:${match[3] || "00"}` : null;
}

export function normaliserHeureFin(heurePointage: unknown, heureFinPrevue: unknown): string | null {
  const pointage = secondesDepuisHeure(heurePointage);
  const finPrevue = secondesDepuisHeure(heureFinPrevue);
  if (pointage === null || finPrevue === null) return null;
  return formaterHeure(pointage > finPrevue ? heureFinPrevue : heurePointage);
}

export function normaliserHeureDebut(heurePointage: unknown, heureDebutPrevue: unknown): string | null {
  const pointage = secondesDepuisHeure(heurePointage);
  const debutPrevu = secondesDepuisHeure(heureDebutPrevue);
  if (pointage === null || debutPrevu === null) return null;
  return formaterHeure(pointage < debutPrevu ? heureDebutPrevue : heurePointage);
}

export interface DureeSeanceEffective {
  heureDebutEffective: string;
  heureFinEffective: string;
  retardMinutes: number;
  dureeMinutes: number;
}

export function calculerDureeSeanceEffective(
  heureDebutPointee: unknown,
  heureFinPointee: unknown,
  heureDebutPrevue: unknown,
  heureFinPrevue: unknown,
): DureeSeanceEffective | null {
  const debutPointage = secondesDepuisHeure(heureDebutPointee);
  const finPointage = secondesDepuisHeure(heureFinPointee);
  const debutPrevu = secondesDepuisHeure(heureDebutPrevue);
  const finPrevue = secondesDepuisHeure(heureFinPrevue);
  if (
    debutPointage === null
    || finPointage === null
    || debutPrevu === null
    || finPrevue === null
    || finPrevue < debutPrevu
  ) return null;

  const heureDebutEffective = normaliserHeureDebut(heureDebutPointee, heureDebutPrevue);
  const finEffective = Math.min(finPointage, finPrevue);
  const dureeAssignee = (finPrevue - debutPrevu) / 60;
  const debutEffectif = secondesDepuisHeure(heureDebutEffective);
  if (debutEffectif === null) return null;
  const dureeMinutes = Math.max(0, Math.min(dureeAssignee, (finEffective - debutEffectif) / 60));
  const heureFinEffective = normaliserHeureFin(heureFinPointee, heureFinPrevue);
  if (!heureDebutEffective || !heureFinEffective) return null;

  return {
    heureDebutEffective,
    heureFinEffective,
    retardMinutes: Math.max(0, Math.floor((debutPointage - debutPrevu) / 60)),
    dureeMinutes: Math.floor(dureeMinutes),
  };
}
