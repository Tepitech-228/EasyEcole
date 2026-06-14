import { EtatsPhysique } from "src/app/data/enums/EtatsPhysique"
import { SituationsMatrimoniales } from "src/app/data/enums/SituationsMatrimoniales"
import { Apprenant } from "./Apprenant.model"

export class IdentiteApprenant {
  declare id?: string
  declare nationalite?: string
  declare ethnie?: string
  declare prefecture?: string
  declare religion?: string
  declare situationMatrimoniale?: SituationsMatrimoniales
  declare etatPhysique?: EtatsPhysique
  declare handicapMoteur?: boolean
  declare handicapVisuel?: boolean
  declare handicapAuditif?: boolean
  declare apprenantId?: string
  declare apprenant?: Apprenant
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}