export interface ReponseReclamation {
  id?: string;
  reclamationId: string;
  repondeurId: string;
  reponse: string;
  date: Date;
  repondeur?: any;
}
