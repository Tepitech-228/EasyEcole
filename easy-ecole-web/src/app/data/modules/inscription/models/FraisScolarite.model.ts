import { Session } from "./Session.model"

/** Modalités de paiement des frais de scolarité (nombre de mensualités). */
export type ModaliteFraisScolarite = '1x' | '3x' | '10x'

export class FraisScolarite {
  declare id: string
  declare sessionId: string
  declare montant: number
  declare modalite: ModaliteFraisScolarite
  declare actif: boolean
  declare session?: Session

  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}
