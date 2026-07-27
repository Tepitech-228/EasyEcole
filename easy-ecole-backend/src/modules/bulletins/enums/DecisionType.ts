export enum DecisionType {
  ADMIS = 'admis',
  RATTRAPAGE = 'rattrapage',
  REDOUBLE = 'redouble',
  ADMIS_AVEC_DETTE = 'admis_avec_dette',
  AJOURNE = 'ajourne',
  EXCLU = 'exclu',
  DEROGATION = 'derogation'
}

export const DECISION_LABELS: Record<DecisionType, string> = {
  [DecisionType.ADMIS]: 'Admis',
  [DecisionType.RATTRAPAGE]: 'Rattrapage',
  [DecisionType.REDOUBLE]: 'Redoublement',
  [DecisionType.ADMIS_AVEC_DETTE]: 'Admis avec dette',
  [DecisionType.AJOURNE]: 'Ajourné',
  [DecisionType.EXCLU]: 'Exclu',
  [DecisionType.DEROGATION]: 'Dérogation'
};

export const PASSAGE_DECISION_MAP: Record<DecisionType, 'admis' | 'rattrapage' | 'redoublement' | 'exclusion'> = {
  [DecisionType.ADMIS]: 'admis',
  [DecisionType.ADMIS_AVEC_DETTE]: 'admis',
  [DecisionType.RATTRAPAGE]: 'rattrapage',
  [DecisionType.REDOUBLE]: 'redoublement',
  [DecisionType.AJOURNE]: 'exclusion',
  [DecisionType.EXCLU]: 'exclusion',
  [DecisionType.DEROGATION]: 'admis'
};
