import { Institution } from "./Institution.model"

export class AdresseInstitution {
  declare id?: string
  declare boitePostale?: string
  declare prorietaireBoitePostale?: string
  declare telMobile?: string
  declare telDomicile?: string
  declare quartier?: string
  declare ville?: string
  declare pays?: string
  declare institutionId?: string
  declare institution?: Institution
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}