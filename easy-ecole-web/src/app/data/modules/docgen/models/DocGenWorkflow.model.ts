import { DocGenType } from "./DocGenType.model";

export class DocGenWorkflow {
  declare id?: string
  declare typeId?: string
  declare type?: DocGenType
  declare ordre?: number
  declare role?: string
  declare libelle?: string
  declare delaiHeures?: number
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
