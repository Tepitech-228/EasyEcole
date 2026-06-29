export interface SanctionDiscipline {
  id?: string;
  etudiant: string;
  matricule: string;
  classe: string;
  date: Date;
  motif: string;
  sanction: string;
  statut: string;
}
