export class Article {
    declare id?: string
    declare nom?: string
    declare reference?: string
    declare description?: string
    declare categorieId?: string
    declare categorie?: any
    declare siteId?: string
    declare site?: any
    declare stockActuel?: number
    declare stockMinimum?: number
    declare prixUnitaire?: number
    declare statut?: string
    declare dateMiseEnService?: string
    declare dureeVieEstimee?: number
    declare dateFinVie?: string
    declare motifFinVie?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
