import { RubriquePaie } from './RubriquePaie.model'

export class LigneBulletin {
    declare id?: string
    declare bulletinId?: string
    declare rubriqueId?: string
    declare rubrique?: RubriquePaie
    declare libelle?: string
    declare base?: number
    declare taux?: number
    declare montant?: number
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
