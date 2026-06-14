import { Enseignant } from "../../auth/models/Enseignant.model";
import { Cours } from "./Cours.model";

export class Seance {
  declare id?: string
  declare titre?: string
  declare date?: Date
  declare heureDebut?: Date
  declare heureFin?: Date
  declare coursId?: string
  declare cours?: Cours
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare description?: string
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}