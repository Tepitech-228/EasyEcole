import { RhPoste } from './RhPoste.model';
import { RhCandidature } from './RhCandidature.model';

export class RhOffreEmploi {
    declare id?: string
    declare posteId?: string
    declare description?: string
    declare datePublication?: Date
    declare dateCloture?: Date
    declare statut?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare poste?: RhPoste
    declare candidatures?: RhCandidature[]
}