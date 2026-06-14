import { NiveauEtude } from "./NiveauEtude.model";
import { PrerequisParcours } from "./PrerequisParcours.model";
import { Cours } from "./Cours.model";

export class Parcours {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  declare prerequisParcours?: PrerequisParcours[]
  declare cours?: Cours[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}