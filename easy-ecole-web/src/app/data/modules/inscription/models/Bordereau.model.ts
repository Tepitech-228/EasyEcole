import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { Echeance } from "./Echeance.model"
import { Quitus } from "./Quitus.model"
import { TypeOperationBordereau } from "./TypeOperationBordereau.model"

export class Bordereau {
  declare id?: string
  declare type?: 'inscription' | 'scolarite' | 'rattrapage'
  declare echeanceId?: string
  declare utilisateurId?: string
  declare fichier?: string
  declare montant?: number
  declare modalite?: '1x' | '3x' | '10x'
  declare referenceBancaire?: string
  declare statut?: 'en_attente' | 'valide' | 'rejete' | 'en_saisie_comptable' | 'traite'
  declare statutPaiement?: 'pending' | 'saisi' | 'finalise'
  declare dateSoumission?: Date
  declare dateValidation?: Date | null
  declare datePaiement?: Date | null
  declare valideParId?: string | null
  declare commentaire?: string
  declare quitusId?: string | null
  declare typeOperationId?: number | null
  declare typeOperation?: TypeOperationBordereau
  declare numeroBordereau?: string | null
  declare moyenPaiement?: 'virement' | 'especes' | 'mobile_money' | 'cheque' | null
  declare echeance?: Echeance
  declare utilisateur?: Utilisateur
  declare validePar?: Utilisateur
  declare quitus?: Quitus

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
