import { TypeDocument } from './TypeDocument.model';
import { DocumentDelivre } from './DocumentDelivre.model';

export interface DemandeDocument {
  id?: string;
  etudiantId: string;
  typeDocumentId: string;
  statut: string;
  date: Date;
  fraisPayes: boolean;
  parcoursId?: string | number;
  niveauEtudeId?: string | number;
  classeId?: string | number;
  anneeAcademiqueId?: string | number;
  etudiant?: any;
  typeDocument?: TypeDocument;
  documentDelivre?: DocumentDelivre;
}
