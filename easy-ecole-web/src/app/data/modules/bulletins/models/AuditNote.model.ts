export class AuditNote {
  declare id?: number;
  declare noteEvaluationId: number;
  declare champModifie: string;
  declare ancienneValeur?: string | null;
  declare nouvelleValeur?: string | null;
  declare modifiePar: number;
  declare dateModification?: string;
  declare modifieParUtilisateur?: any;
  declare noteEvaluation?: any;
}
