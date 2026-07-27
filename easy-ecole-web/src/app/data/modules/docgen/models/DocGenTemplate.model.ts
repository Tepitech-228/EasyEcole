import { DocGenType } from "./DocGenType.model";

export class DocGenTemplate {
  declare id?: string
  declare typeId?: string
  declare type?: DocGenType
  declare libelle?: string
  declare contenu?: string
  declare variables?: string
  declare version?: number
  declare isDefault?: boolean
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
