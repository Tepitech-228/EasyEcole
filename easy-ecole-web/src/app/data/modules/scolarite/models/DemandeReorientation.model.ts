export interface DemandeReorientation {
  id?: string;
  cursusApprenantId: number;
  parcoursActuelId: number;
  parcoursCibleId: number;
  motif: string;
  statut?: 'soumise' | 'etude' | 'approuvee' | 'rejetee';
  dateTraitement?: Date;
  traitePar?: number;
}
