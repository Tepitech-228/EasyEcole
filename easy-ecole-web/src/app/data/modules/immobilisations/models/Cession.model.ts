export class Cession {
    declare id?: string
    declare immobilisationId?: string
    declare immobilisation?: any
    declare dateCession?: string
    declare motif?: string
    declare typeOperation?: string
    declare prixCession?: number
    declare destinataire?: string
    declare approuvePar?: string
    declare approuveParUtilisateur?: any
    declare dateApprobation?: string
    declare motifRefus?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
