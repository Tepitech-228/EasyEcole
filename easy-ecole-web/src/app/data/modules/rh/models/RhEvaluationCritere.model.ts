import { RhCritereEvaluation } from './RhCritereEvaluation.model';
import { RhFicheEvaluation } from './RhFicheEvaluation.model';

/** Modèle de note / évaluation par critère (table `rh_evaluations_criteres`). */
export class RhEvaluationCritere {
    declare id?: string
    declare ficheId?: string
    declare critereId?: string
    declare note?: number
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare fiche?: RhFicheEvaluation
    declare critere?: RhCritereEvaluation
}