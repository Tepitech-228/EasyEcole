export interface PointageEcheanceFinanciere {
  id?: number;
  numeroEcheance: number;
  type: 'inscription' | 'scolarite';
  mois: string;
  montant: number;
  montantPaye: number;
  resteAPayer: number;
  devise: string;
  dateLimite: string;
  statut: 'impaye' | 'paye' | 'en_retard' | 'partiel';
  estPaye: boolean;
  enRetard: boolean;
}

export interface PointageSituationFinanciere {
  sommeGlobale: number;
  montantPaye: number;
  resteAPayer: number;
  estAJour: boolean;
  echeancesEnRetard: number;
  echeancesPayees: number;
  echeancesTotales: number;
  moisEnCours: PointageEcheanceFinanciere | null;
  echeances: PointageEcheanceFinanciere[];
}
