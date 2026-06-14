import { Parcours } from "./Parcours.model";

export class Categorie {
  declare id?: string
  declare libelle?: string
  declare description?: string
  declare parcours?: Parcours[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}