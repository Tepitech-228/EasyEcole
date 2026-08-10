import { TypeDocument } from './TypeDocument.model';
import { DocumentDelivre } from './DocumentDelivre.model';

export type SourceDemandeDocument = 'automatique' | 'demande_etudiant';

export interface DemandeDocument {
  id?: string;
  etudiantId: string;
  typeDocumentId: string;
  statut: string;
  date: Date;
  fraisPayes: boolean;
  /** 'automatique' = génération normale (gratuite) | 'demande_etudiant' = demande volontaire (payante) */
  source?: SourceDemandeDocument;
  /** Montant facturé (0 = gratuit). Calculé par le serveur, jamais envoyé au POST */
  montant?: number;
  /** Référence du paiement / bordereau (renseigné après confirmation du paiement) */
  paiementId?: string | number | null;
  /** Compte produit (classe 7) utilisé pour l'écriture comptable */
  compteProduit?: string | null;
  parcoursId?: string | number;
  niveauEtudeId?: string | number;
  classeId?: string | number;
  anneeAcademiqueId?: string | number;
  etudiant?: any;
  typeDocument?: TypeDocument;
  documentDelivre?: DocumentDelivre;
}

/**
 * Réponse de GET /scolarite/demandesDocument/:id/verifier-acces
 * Indique si la demande est gratuite ou payante et l'état du paiement.
 */
export interface VerifierAccesDemandeDocument {
  gratuit: boolean;
  montant: number;
  fraisPayes: boolean;
  source: SourceDemandeDocument;
}
