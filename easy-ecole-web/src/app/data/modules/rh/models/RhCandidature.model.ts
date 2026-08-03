import { RhOffreEmploi } from './RhOffreEmploi.model';
import { RhEntretien } from './RhEntretien.model';

export class RhCandidature {
    declare id?: string
    declare offreId?: string
    declare nom?: string
    declare email?: string
    declare telephone?: string
    declare cv?: string
    declare lettreMotivation?: string
    declare statut?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    declare offre?: RhOffreEmploi
    declare entretiens?: RhEntretien[]
}