import { CaissierBanque } from "./CaissierBanque.model";

export class AdresseCaissierBanque {
  declare id?: string
  declare boitePostale?: string
  declare prorietaireBoitePostale?: string
  declare telMobile?: string
  declare telDomicile?: string
  declare quartier?: string
  declare ville?: string
  declare pays?: string
  declare caissierBanqueId?: string
  declare caissierBanque?: CaissierBanque
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}