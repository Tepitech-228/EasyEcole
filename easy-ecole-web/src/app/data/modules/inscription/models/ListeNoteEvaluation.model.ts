import { TypeNoteEvaluation } from "./TypeNoteEvaluation.model"
import { Cours } from "./Cours.model"
import { Enseignant } from "../../auth/models/Enseignant.model"
import { NoteEvaluation } from "./NoteEvaluation.model"

export class ListeNoteEvaluation {
  declare id?: string
  declare date?: Date
  declare heureDebut?: string
  declare heureFin?: string
  declare commentaire?: string
  declare poidsTypeNoteEvaluation?: number

  declare typeNoteEvaluationId?: string
  declare typeNoteEvaluation?: TypeNoteEvaluation
  declare coursId?: string
  declare cours?: Cours
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare notesEvaluation?: NoteEvaluation[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
