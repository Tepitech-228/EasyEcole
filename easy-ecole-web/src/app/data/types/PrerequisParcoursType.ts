import { PeriodesEvaluation } from "../enums/PeriodesEvaluation";
import { TypesEvaluation } from "../enums/TypesEvaluation";

export type PrerequisParcoursType = {
  id: string;
  matiere: string;
  periode: PeriodesEvaluation;
  evaluation: TypesEvaluation;
  note: number;
};

export const COLUMNS_SCHEMA = [
  {
    key: "matiere",
    type: "list",
    label: "Matière"
  },
  {
    key: "periode",
    type: "list",
    label: "Période d'évaluation"
  },
  {
    key: "evaluation",
    type: "list",
    label: "Type d'évaluation"
  },
  {
    key: "note",
    type: "number",
    label: "Note requise"
  },
]

export const COLUMNS_SCHEMA_2 = [
  {
    key: "matiere",
    type: "list",
    label: "Matière"
  },
  {
    key: "periode",
    type: "list",
    label: "Période d'évaluation"
  },
  {
    key: "evaluation",
    type: "list",
    label: "Type d'évaluation"
  },
  {
    key: "note",
    type: "number",
    label: "Note requise"
  },
  {
    key: "note2",
    type: "number",
    label: "Note Obtenue"
  },
]