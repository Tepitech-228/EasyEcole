export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateNoteValue(note: unknown): number | null {
  if (note === undefined || note === null || note === "") return null;
  const num = Number(note);
  if (isNaN(num)) throw new ValidationError("La note doit être un nombre");
  if (num < 0 || num > 20) throw new ValidationError("La note doit être comprise entre 0 et 20");
  return Math.round(num * 10) / 10;
}

export function validateEvaluationInput(body: Record<string, unknown>): void {
  const required = ["typeNoteEvaluationId", "coursId", "anneeAcademiqueId"];
  for (const field of required) {
    if (!body[field]) throw new ValidationError(`Le champ ${field} est requis`);
  }
  if (!body.date) throw new ValidationError("La date est requise");
  if (body.poidsTypeNoteEvaluation !== undefined) {
    const poids = Number(body.poidsTypeNoteEvaluation);
    if (isNaN(poids) || poids < 0) throw new ValidationError("Le poids doit être un nombre positif");
  }
}

export function validateBulkNotesInput(body: { listeNoteEvaluationId?: unknown; notes?: unknown[] }): void {
  if (!body.listeNoteEvaluationId) throw new ValidationError("listeNoteEvaluationId requis");
  if (!Array.isArray(body.notes)) throw new ValidationError("notes requis (tableau)");
  for (const item of body.notes) {
    if (!item || typeof item !== "object") throw new ValidationError("Chaque note doit être un objet");
    const n = item as Record<string, unknown>;
    if (!n.coursParticipantId) throw new ValidationError("coursParticipantId requis pour chaque note");
  }
}
