import { AdresseInstitution } from "./AdresseInstitution.model"
import { Utilisateur } from "./Utilisateur.model"

export class Institution {
  declare id?: string
  declare dateNaissance?: Date
  declare lieuNaissance?: string
  declare fonction?: string
  declare adresseId?: string
  declare adresse?: AdresseInstitution
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}