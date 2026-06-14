import { Enseignant } from "../../auth/models/Enseignant.model"
import { Cours } from "./Cours.model"
import { Presence } from "./Presence.model"

export class ListePresence {
  declare id?: string
  declare titre?: string
  declare description?: string

  declare coursId?: string
  declare cours?: Cours
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare presences?: Presence[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}