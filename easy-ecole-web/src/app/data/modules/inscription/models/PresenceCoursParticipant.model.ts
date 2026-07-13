import { EtatsDePresence } from "src/app/data/enums/EtatsDePresence"
import { CoursParticipant } from "./CoursParticipant.model"
import { Presence } from "./Presence.model"

export class PresenceCoursParticipant {
  declare etatDePresence?: EtatsDePresence

  declare presenceId?: string
  declare presence?: Presence
  declare coursParticipantId?: string
  declare coursParticipant?: CoursParticipant

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}