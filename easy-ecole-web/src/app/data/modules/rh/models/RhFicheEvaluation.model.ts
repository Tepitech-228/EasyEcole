import { RhEmploye } from './RhEmploye.model';
import { RhEvaluationCritere } from './RhEvaluationCritere.model';

/** Modèle de fiche d'évaluation RH (table `rh_fiches_evaluation`). */
export class RhFicheEvaluation {
    declare id?: string
    declare employeId?: string
    declare evaluateurId?: string
    declare dateEvaluation?: string
    declare noteGlobale?: number
    declare commentaire?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare employe?: RhEmploye
    declare evaluationsCriteres?: RhEvaluationCritere[]
}