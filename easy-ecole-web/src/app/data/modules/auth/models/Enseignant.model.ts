import { Utilisateur } from "./Utilisateur.model";
import { AdresseEnseignant } from "./AdresseEnseignant.model";
import { Cours } from "../../inscription/models/Cours.model";

export class Enseignant {
  declare id?: string
  declare photo?: string
  declare qrCode?: string
  declare matricule?: string
  declare dateNaissance?: Date
  declare lieuNaissance?: string
  declare fonction?: string
  declare sexe?: string
  declare nationalite?: string
  declare contact?: string
  declare cni?: string
  declare nifOtr?: string
  declare plusHautDiplome?: string
  declare gradeAcademique?: string
  declare statut?: string
  declare specialite?: string
  declare fonctionAdministrative?: string
  declare anneeExperience?: number
  declare heureTheoriqueAnnuelle?: number
  declare heureReelleAnnuelle?: number
  declare statutHandicap?: boolean
  declare natureHandicap?: string
  declare adresseId?: string
  declare adresse?: AdresseEnseignant
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur

  declare cours?: Cours[]
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}