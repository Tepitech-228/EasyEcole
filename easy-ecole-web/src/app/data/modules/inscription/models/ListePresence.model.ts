import { Enseignant } from "../../auth/models/Enseignant.model"
import { Cours } from "./Cours.model"
import { Presence } from "./Presence.model"
import { Parcours } from "./Parcours.model"
import { NiveauEtude } from "./NiveauEtude.model"
import { CoursParticipant } from "./CoursParticipant.model"

export class ListePresence {
  declare id?: string
  declare titre?: string
  declare description?: string

  declare coursId?: string
  declare cours?: Cours
  declare parcoursId?: string
  declare parcours?: Parcours
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  declare etablissementId?: string
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare presences?: Presence[]
  declare coursParticipants?: CoursParticipant[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}