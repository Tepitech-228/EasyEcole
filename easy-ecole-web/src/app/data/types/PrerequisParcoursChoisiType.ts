import { PeriodesEvaluation } from "../enums/PeriodesEvaluation";
import { TypesEvaluation } from "../enums/TypesEvaluation";

export type PrerequisParcoursChoisiType = {
  id: string;
  matiere: string;
  periode: PeriodesEvaluation;
  evaluation: TypesEvaluation;
  note: number;
  note2: number;
};