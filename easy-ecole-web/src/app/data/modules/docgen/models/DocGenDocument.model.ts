import { DocGenType } from "./DocGenType.model";
import { DocGenTemplate } from "./DocGenTemplate.model";

export class DocGenDocument {
  declare id?: string
  declare typeId?: string
  declare type?: DocGenType
  declare templateId?: string
  declare template?: DocGenTemplate
  declare reference?: string
  declare statut?: string
  declare filePath?: string
  declare hash?: string
  declare metadata?: string
  declare sourceType?: string
  declare sourceId?: number
  declare generatedById?: number
  declare version?: number
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
