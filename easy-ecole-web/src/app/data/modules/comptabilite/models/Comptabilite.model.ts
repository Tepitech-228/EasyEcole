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

export interface ExerciceComptable {
  id: number;
  code: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  statut: 'Ouvert' | 'En cours de clôture' | 'Clôturé';
  dateCloture: string | null;
  resultatNet: number | null;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Poste comptable dans un état financier (Bilan ou Compte de résultat)
 */
export interface PosteComptable {
  compte: {
    id: number;
    numero: string;
    libelle: string;
    classe: string;
    nature?: string;
    categorie?: string;
  };
  solde: number;
  soldeSigne: number;
  section?: string;
}

/**
 * Réponse API : Bilan comptable
 */
export interface BilanResponse {
  success: boolean;
  data: {
    exercice: ExerciceComptable | null;
    dateArrete: string;
    actif: {
      total: number;
      postes: PosteComptable[];
    };
    passif: {
      total: number;
      postes: PosteComptable[];
    };
    equilibre: boolean;
    ecart: number;
  };
}

/**
 * Réponse API : Compte de résultat
 */
export interface CompteResultatResponse {
  success: boolean;
  data: {
    exercice: ExerciceComptable | null;
    periode: {
      dateDebut: string;
      dateFin: string;
    };
    produits: {
      total: number;
      postes: PosteComptable[];
    };
    charges: {
      total: number;
      postes: PosteComptable[];
    };
    resultatNet: number;
  };
}
