import { MatierePrerequis } from "./MatierePrerequis.model";
import { Parcours } from "./Parcours.model";
import { NiveauEtude } from "./NiveauEtude.model";
import { TypesEvaluation } from "src/app/data/enums/TypesEvaluation";
import { PeriodesEvaluation } from "src/app/data/enums/PeriodesEvaluation";

export class PrerequisParcours {
  declare id: string
  declare noteRequise: number
  declare typeEvaluation: TypesEvaluation
  declare periodeEvaluation: PeriodesEvaluation
  declare parcoursId: string
  declare parcours?: Parcours
  declare niveauEtudeId: string
  declare niveauEtude?: NiveauEtude
  declare matierePrerequisId: string
  declare matierePrerequis?: MatierePrerequis
  
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}