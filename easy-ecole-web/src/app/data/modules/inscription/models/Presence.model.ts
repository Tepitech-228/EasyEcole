import { ListePresence } from "./ListePresence.model"
import { PresenceCoursParticipant } from "./PresenceCoursParticipant.model"

export class Presence {
  declare id?: string
  declare date?: Date
  declare heureDebut?: Date
  declare heureFin?: Date
  declare signature?: string
  declare signedAt?: Date
  declare auteurEnseignantId?: string | null

  declare listePresenceId?: string
  declare listePresence?: ListePresence
  declare presencesCoursParticipants?: PresenceCoursParticipant[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}