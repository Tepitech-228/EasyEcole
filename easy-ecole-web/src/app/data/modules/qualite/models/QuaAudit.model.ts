export class QuaAudit {
  declare id?: string
  declare type?: 'interne' | 'externe'
  declare titre?: string
  declare processus?: string
  declare datePlanifiee?: Date
  declare dateRealisation?: Date
  declare equipe?: string
  declare referentiel?: string
  declare constats?: string
  declare conclusion?: string
  declare statut?: 'planifie' | 'en_cours' | 'termine' | 'cloture'
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
