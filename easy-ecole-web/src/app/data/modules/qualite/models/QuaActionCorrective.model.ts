export class QuaActionCorrective {
  declare id?: string
  declare nonConformiteId?: string
  declare type?: 'corrective' | 'preventive'
  declare description?: string
  declare responsableId?: number
  declare dateLimite?: Date
  declare statut?: 'planifiee' | 'en_cours' | 'terminee' | 'verifiee'
  declare efficacite?: 'satisfaisante' | 'partielle' | 'insuffisante'
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
