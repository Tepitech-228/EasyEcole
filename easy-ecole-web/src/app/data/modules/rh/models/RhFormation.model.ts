import { RhParticipationFormation } from './RhParticipationFormation.model';

/** Modèle de formation RH (table `rh_formations`). */
export class RhFormation {
    declare id?: string
    declare titre?: string
    declare description?: string
    declare dateDebut?: string
    declare dateFin?: string
    declare formateur?: string
    /** ENUM backend : 'interne' | 'externe' */
    declare type?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare participations?: RhParticipationFormation[]
}