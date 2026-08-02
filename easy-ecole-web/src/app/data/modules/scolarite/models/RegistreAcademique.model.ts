export interface RegistreAcademique {
  id?: string;
  etudiant: string;
  matricule: string;
  classe: string;
  filiere?: string;
  niveau?: string;
  moyenne: number;
  rang: number;
  decision: string;
  anneeScolaire: string;
  cursusApprenantId?: number;
}
