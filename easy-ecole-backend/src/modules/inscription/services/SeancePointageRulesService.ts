const DELAI_GRACE_DEPART_SECONDES = 15 * 60;

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
  return depart > finPrevue + DELAI_GRACE_DEPART_SECONDES;
}

export function validerMotifDepart(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const motif = value.trim();
  return motif.length > 0 && motif.length <= 500 ? motif : null;
}
