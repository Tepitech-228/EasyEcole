import { Utilisateur } from "../../auth/models/Utilisateur.model";
import { ParcoursChoisi } from "./ParcoursChoisi.model";

export class PanierParcoursChoisi {
  declare id?: string
  declare parcoursChoisiId?: string
  declare parcoursChoisi?: ParcoursChoisi
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}