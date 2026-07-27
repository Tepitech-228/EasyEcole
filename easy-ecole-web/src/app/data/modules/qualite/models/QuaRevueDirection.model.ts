export class QuaRevueDirection {
  declare id?: string
  declare titre?: string
  declare dateTenue?: Date
  declare participants?: string
  declare ordreJour?: string
  declare compteRendu?: string
  declare statut?: 'planifiee' | 'tenue' | 'validee'
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
