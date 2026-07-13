import { ParcoursChoisi } from "./ParcoursChoisi.model";
import { PrerequisParcours } from "./PrerequisParcours.model";

export class PrerequisParcoursChoisi {
  declare id?: string
  declare note?: number
  declare parcoursChoisiId?: string
  declare parcoursChoisi?: ParcoursChoisi
  declare prerequisParcoursId?: string
  declare prerequisParcours?: PrerequisParcours
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}