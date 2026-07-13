import { Apprenant } from "./Apprenant.model"

export class AdresseApprenant {
  declare id?: string
  declare boitePostale?: string
  declare prorietaireBoitePostale?: string
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