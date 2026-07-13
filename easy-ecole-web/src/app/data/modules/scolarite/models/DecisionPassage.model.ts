export interface DecisionPassage {
  id?: string;
  cursusApprenantId: number;
  anneeAcademiqueId: number;
  moyenneGenerale: number;
  creditsAcquis: number;
  creditsRequis: number;
  decision: 'admis' | 'rattrapage' | 'redoublement' | 'exclusion';
  dateDecision: Date;
  validePar: number;
}
