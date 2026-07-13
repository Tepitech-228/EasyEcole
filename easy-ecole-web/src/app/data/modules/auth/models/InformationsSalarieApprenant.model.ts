import { Apprenant } from "./Apprenant.model"

export class InformationsSalarieApprenant {
  declare id?: string
  declare estSalarie?: boolean
  declare profession?: string
  declare entreprise?: string
  declare apprenantId?: string
  declare apprenant?: Apprenant
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}