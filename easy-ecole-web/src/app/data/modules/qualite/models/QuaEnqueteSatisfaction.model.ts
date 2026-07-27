export class QuaEnqueteSatisfaction {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare cible?: string
  declare questions?: any
  declare dateDebut?: Date
  declare dateFin?: Date
  declare statut?: 'brouillon' | 'active' | 'cloturee'
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
