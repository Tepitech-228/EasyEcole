import { PeriodePaie } from './PeriodePaie.model'
import { LigneBulletin } from './LigneBulletin.model'

export class BulletinPaie {
    declare id?: string
    declare employeId?: string
    declare employe?: any
    declare periodeId?: string
    declare periode?: PeriodePaie
    declare salaireBase?: number
    declare totalGains?: number
    declare totalRetenues?: number
    declare totalCotisations?: number
    declare netAPayer?: number
    declare dateGeneration?: string
    declare statut?: string
    declare lignesBulletin?: LigneBulletin[]
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}
