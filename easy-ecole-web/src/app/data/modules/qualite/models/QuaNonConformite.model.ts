export class QuaNonConformite {
  declare id?: string
  declare type?: 'critique' | 'majeure' | 'mineure'
  declare source?: string
  declare processus?: string
  declare description?: string
  declare cause?: string
  declare statut?: 'ouverte' | 'en_cours' | 'traitee' | 'fermee'
  declare priorite?: 'haute' | 'moyenne' | 'basse'
  declare declareePar?: number
  declare declareeLe?: Date
  declare clotureeLe?: Date
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
