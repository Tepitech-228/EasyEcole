
import { Enseignant } from "./Enseignant.model";

export class AdresseEnseignant {
  declare id?: string
  declare boitePostale?: string
  declare prorietaireBoitePostale?: string
  declare telMobile?: string
  declare telDomicile?: string
  declare quartier?: string
  declare ville?: string
  declare pays?: string
  declare enseignantId?: string
  declare enseignant?: Enseignant
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}