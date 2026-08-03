/** Modèle de critère d'évaluation (table `rh_criteres_evaluation`). */
export class RhCritereEvaluation {
    declare id?: string
    declare nom?: string
    declare description?: string
    declare poids?: number
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}