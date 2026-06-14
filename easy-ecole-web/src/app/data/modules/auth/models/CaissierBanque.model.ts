import { Utilisateur } from "./Utilisateur.model";
import { AdresseCaissierBanque } from "./AdresseCaissierBanque.model";
import { Banque } from "./Banque.model";

export class CaissierBanque {
  declare id?: string
  declare dateNaissance?: Date
  declare lieuNaissance?: string
  declare fonction?: string
  declare adresseId?: string
  declare adresse?: AdresseCaissierBanque
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare banqueId?: string
  declare banque?: Banque
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}