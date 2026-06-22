export class Article {
    declare id?: string
    declare nom?: string
    declare reference?: string
    declare description?: string
    declare categorieId?: string
    declare siteId?: string
    declare site?: any
    declare stockActuel?: number
    declare stockMinimum?: number
    declare prixUnitaire?: number
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
