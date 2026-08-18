import { AdresseApprenant } from "./AdresseApprenant.model";
import { IdentiteApprenant } from "./IdentiteApprenant.model";
import { InformationsParentsApprenant } from "./InformationsParentsApprenant.model";
import { InformationsSalarieApprenant } from "./InformationsSalarieApprenant.model";
import { PersonnePrevenirApprenant } from "./PersonnePrevenirApprenant.model";
import { Utilisateur } from "./Utilisateur.model";
import { CursusApprenant } from "../../inscription/models/CursusApprenant.model";
import { Parcours } from "../../inscription/models/Parcours.model";
import { Classe } from "../../inscription/models/Classe.model";
import { NiveauEtude } from "../../inscription/models/NiveauEtude.model";

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
  declare cursusApprenant?: CursusApprenant[]

  declare sexe?: string
  declare cni?: string
  declare nationalite?: string
  declare statutHandicap?: boolean
  declare natureHandicap?: string
  declare anneeObtentionBac?: string
  declare serieBac?: string
  declare anneePremiereInscription?: string
  declare nombreInscriptions?: number
  declare statutEtudiant?: string
  declare diplomePrepare?: string
  declare periode?: 'matin' | 'soir'
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}