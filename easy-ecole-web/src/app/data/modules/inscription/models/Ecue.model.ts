export class Ecue {
  declare id?: string
  declare code?: string
  declare libelle?: string
  declare creditEcts?: number
  declare coefficient?: number
  declare coursId?: string
  declare cmHoraire?: number
  declare tdTpHoraire?: number
  declare tpeHoraire?: number
  declare type?: 'F' | 'T' | 'S' | 'C' | 'L' | 'M'
  declare enseignantId?: string
  declare enseignant?: { id?: string; utilisateur?: { nom?: string; prenoms?: string } }

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
