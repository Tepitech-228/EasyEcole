import { Utilisateur } from "./Utilisateur.model";
import { AdresseEnseignant } from "./AdresseEnseignant.model";
import { Cours } from "../../inscription/models/Cours.model";

export class Enseignant {
  declare id?: string
  declare photo?: string
  declare qrCode?: string
  declare dateNaissance?: Date
  declare lieuNaissance?: string
  declare fonction?: string
  declare adresseId?: string
  declare adresse?: AdresseEnseignant
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur

  declare cours?: Cours[]
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}