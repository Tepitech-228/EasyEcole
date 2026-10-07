export class Shift {
  declare id?: number
  declare nom: string
  declare heureDebut: string
  declare heureFin: string
  declare jours: string[]
  declare actif?: boolean

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
