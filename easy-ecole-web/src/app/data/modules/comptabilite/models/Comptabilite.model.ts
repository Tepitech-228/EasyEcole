import { Utilisateur } from "../../auth/models/Utilisateur.model"

export class Compte {
  declare id?: string
  declare numero: string
  declare libelle: string
  declare classe: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  declare sousClasse?: string
  declare nature: 'Débit' | 'Crédit' | 'Débit/Crédit'
  declare categorie: string
  declare description?: string
  declare actif: boolean
  declare moduleSource?: string
}

export class JournalComptable {
  declare id?: string
  declare code: string
  declare libelle: string
  declare type: 'Achat' | 'Vente' | 'Banque' | 'Caisse' | 'Paie' | 'OD' | 'Divers'
  declare description?: string
  declare actif: boolean
}

export class EcritureComptable {
  declare id?: string
  declare journalId?: string
  declare numeroEcriture: string
  declare dateEcriture: Date
  declare dateComptable: Date
  declare compteDebitId?: string
  declare compteCreditId?: string
  declare montant: number
  declare libelle: string
  declare reference?: string
  declare pieceJustificative?: string
  declare moduleSource?: string
  declare referenceModuleId?: string
  declare utilisateurSaisieId?: string
  declare validee: boolean
  declare utilisateurValidationId?: string
  declare dateValidation?: Date | null
  declare observations?: string

  declare journal?: JournalComptable
  declare compteDebit?: Compte
  declare compteCredit?: Compte
  declare utilisateurSaisie?: Utilisateur
  declare utilisateurValidation?: Utilisateur

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
