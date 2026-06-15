import { OffreStage } from './OffreStage.model';
import { Apprenant } from '../../auth/models/Apprenant.model';

export class DemandeStage {
    declare id?: string
    declare offreStageId?: string
    declare apprenantId?: string
    declare entrepriseId?: string
    declare nouvelleEntreprise?: string
    declare dateDebut?: Date
    declare dateFin?: Date
    declare statut?: string
    declare motifRejet?: string
    declare motivation?: string
    declare apprenant?: Apprenant
    declare offreStage?: OffreStage

    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
