import { Parcours } from "./Parcours.model";

export class DeboucheParcours {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare video?: string
  declare parcoursId?: string
  declare parcours?: Parcours
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}