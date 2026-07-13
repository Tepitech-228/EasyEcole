export interface SanctionAcademique {
  id?: string;
  cursusApprenantId: number;
  type: 'avertissement' | 'suspension' | 'exclusion';
  dateDebut: Date;
  dateFin?: Date;
  motif: string;
  decidePar: number;
}
