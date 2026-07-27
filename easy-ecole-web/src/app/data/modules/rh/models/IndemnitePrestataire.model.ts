import { Prestataire } from './Prestataire.model';

export class IndemnitePrestataire {
    declare id?: string
    declare prestataireId?: string
    declare prestataire?: Prestataire
    declare typeIndemnite?: string
    declare libelle?: string
    declare montant?: number
    declare devise?: string
    declare dateDebut?: string
    declare dateFin?: string
    declare nombreJours?: number
    declare description?: string
    declare statut?: string
    declare datePaiement?: string
    declare modePaiement?: string
    declare validePar?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
