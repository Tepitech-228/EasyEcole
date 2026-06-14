import { Parcours } from "./Parcours.model";

export class NiveauEtude {
  declare id?: string
  declare libelle?: string
  declare parcours?: Parcours[]
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}