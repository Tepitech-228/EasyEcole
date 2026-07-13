import { ReponseReclamation } from './ReponseReclamation.model';

export interface Reclamation {
  id?: string;
  etudiantId: string;
  evaluationId?: string;
  motif: string;
  statut: string;
  date: Date;
  etudiant?: any;
  reponsesReclamation?: ReponseReclamation[];
}
