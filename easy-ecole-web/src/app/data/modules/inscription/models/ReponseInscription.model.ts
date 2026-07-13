import { Utilisateur } from "../../auth/models/Utilisateur.model";
import { DemandeInscription } from "./DemandeInscription.model";

export class ReponseInscription {
  declare id?: string
  declare message?: string
  declare dateReponse?: Date
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare demandeInscriptionId?: string
  declare demandeInscription?: DemandeInscription

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}