import { Utilisateur } from "./Utilisateur.model";
import { CaissierBanque } from "./CaissierBanque.model";

export class Banque {
  declare id?: string
  declare nom?: string
  declare logo?: string
  declare caissiers?: Utilisateur
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}