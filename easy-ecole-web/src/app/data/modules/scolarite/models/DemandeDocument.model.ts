import { TypeDocument } from './TypeDocument.model';
import { DocumentDelivre } from './DocumentDelivre.model';

export interface DemandeDocument {
  id?: string;
  etudiantId: string;
  typeDocumentId: string;
  statut: string;
  date: Date;
  fraisPayes: boolean;
  etudiant?: any;
  typeDocument?: TypeDocument;
  documentDelivre?: DocumentDelivre;
}
