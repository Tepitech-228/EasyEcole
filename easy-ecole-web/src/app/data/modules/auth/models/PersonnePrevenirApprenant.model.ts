import { Apprenant } from "./Apprenant.model"

export class PersonnePrevenirApprenant {
  declare id?: string
  declare nom?: string
  declare prenoms?: string
  declare boitePostale?: string
  declare email?: string
  declare telMobile?: string
  declare telDomicile?: string
  declare quartier?: string
  declare ville?: string
  declare pays?: string
  declare apprenantId?: string
  declare apprenant?: Apprenant
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}