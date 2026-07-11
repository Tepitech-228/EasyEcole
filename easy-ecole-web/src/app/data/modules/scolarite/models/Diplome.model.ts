export interface Diplome {
  id?: string;
  cursusApprenantId: number;
  parcoursId: number;
  niveauEtudeId: number;
  anneeObtention: number;
  mention: 'passable' | 'assez_bien' | 'bien' | 'tres_bien';
  numeroDiplome: string;
  dateDelivrance: Date;
  fichierPDF?: string;
}
