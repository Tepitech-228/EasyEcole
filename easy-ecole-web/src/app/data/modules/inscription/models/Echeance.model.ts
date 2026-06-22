import { DossierEtudiant } from "./DossierEtudiant.model"

export class Echeance {
  declare id?: string
  declare dossierEtudiantId?: string
  declare type?: 'inscription' | 'scolarite'
  declare numeroEcheance?: number
  declare montant?: number
  declare devise?: string
  declare dateLimite?: Date
  declare datePaiement?: Date | null
  declare statut?: 'impaye' | 'paye' | 'en_retard'
  declare moisConcerne?: string
  declare dossierEtudiant?: DossierEtudiant

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
