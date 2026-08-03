import { RhFormation } from './RhFormation.model';
import { RhEmploye } from './RhEmploye.model';

/** Modèle de participation à une formation (table `rh_participations_formation`). */
export class RhParticipationFormation {
    declare id?: string
    declare formationId?: string
    declare employeId?: string
    /** ENUM backend : 'inscrit' | 'terminé' | 'abandon' */
    declare statut?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare formation?: RhFormation
    declare employe?: RhEmploye
}