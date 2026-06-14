import { TypesPaiement } from "src/app/data/enums/TypesPaiement"
import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { DemandeInscription } from "./DemandeInscription.model"

export class PaiementInscription {
  declare id?: string
  declare numero?: string
  declare datePaiement?: Date
  declare description?: string
  declare montant?: number
  declare matriculeInscription?: string
  declare type?: TypesPaiement
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare demandeInscription?: DemandeInscription

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}