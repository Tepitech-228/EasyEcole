import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { Echeance } from "./Echeance.model"
import { Quitus } from "./Quitus.model"

export class Bordereau {
  declare id?: string
  declare type?: 'inscription' | 'scolarite'
  declare echeanceId?: string
  declare utilisateurId?: string
  declare fichier?: string
  declare montant?: number
  /** Modalité de paiement choisie par l'étudiant lors de la génération du bordereau d'inscription. */
  declare modalite?: '1x' | '3x' | '10x'
  declare referenceBancaire?: string
  declare statut?: 'en_attente' | 'valide' | 'rejete'
  declare dateSoumission?: Date
  declare dateValidation?: Date | null
  declare valideParId?: string | null
  declare commentaire?: string
  declare echeance?: Echeance
  declare utilisateur?: Utilisateur
  declare validePar?: Utilisateur
  declare quitus?: Quitus

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
