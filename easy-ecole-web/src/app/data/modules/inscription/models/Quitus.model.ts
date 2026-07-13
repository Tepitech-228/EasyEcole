import { Bordereau } from "./Bordereau.model"

export class Quitus {
  declare id?: string
  declare paiementInscriptionId?: string
  declare bordereauId?: string
  declare code?: string
  declare dateEmission?: Date
  declare fichierPDF?: string
  declare statut?: 'genere' | 'valide' | 'annule'
  declare bordereau?: Bordereau

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
