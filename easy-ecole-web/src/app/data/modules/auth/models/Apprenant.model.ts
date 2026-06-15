import { AdresseApprenant } from "./AdresseApprenant.model";
import { IdentiteApprenant } from "./IdentiteApprenant.model";
import { InformationsParentsApprenant } from "./InformationsParentsApprenant.model";
import { InformationsSalarieApprenant } from "./InformationsSalarieApprenant.model";
import { PersonnePrevenirApprenant } from "./PersonnePrevenirApprenant.model";
import { Utilisateur } from "./Utilisateur.model";

export class Apprenant {
  declare id?: string
  declare photo: string
  declare qrCode?: string
  declare dateNaissance: Date
  declare lieuNaissance: string
  declare adresseId: string
  declare adresse?: AdresseApprenant
  declare identiteId: string
  declare identite?: IdentiteApprenant
  declare informationsSalarieId: string
  declare informationsSalarie?: InformationsSalarieApprenant
  declare informationsParentsId: string
  declare informationsParents?: InformationsParentsApprenant
  declare personnePrevenirId: string
  declare personnePrevenir?: PersonnePrevenirApprenant
  declare utilisateurId: string
  declare utilisateur?: Utilisateur
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}