import { RolesUtilisateur } from "../../../enums/RolesUtilisateur";
import { Apprenant } from "./Apprenant.model";
import { CaissierBanque } from "./CaissierBanque.model";
import { Institution } from "./Institution.model";

export class Utilisateur {
  declare id?: string
  declare nom?: string
  declare prenoms?: string
  declare identifiant?: string
  declare email?: string
  declare motDePasse?: string
  declare role?: RolesUtilisateur
  declare contact?: string
  declare photoDeProfil?: string
  declare dateVerificationEmail?: Date

  declare apprenant?: Apprenant
  declare institution?: Institution
  declare caissier?: CaissierBanque

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}