import { Session } from "./Session.model"

export class FraisInscription {
  declare id: string
  declare titre: string
  declare description: string
  declare montant: number
  declare fraisDesCours: boolean
  declare sessionId: string
  declare session?: Session

  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}