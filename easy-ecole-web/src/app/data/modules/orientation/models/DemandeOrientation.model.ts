import { ReponseOrientation } from "./ReponseOrientation.model";
import { ParcoursChoisi } from "./ParcoursChoisi.model";
import { EtatsValidationParcours } from "../../../enums/EtatsValidationParcours";
import { Utilisateur } from "../../auth/models/Utilisateur.model";

export class DemandeOrientation {
  declare id?: string
  declare dateDemande?: Date
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare reponseOrientationId?: string
  declare reponseOrientation?: ReponseOrientation
  declare parcoursChoisis?: ParcoursChoisi[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date

  static tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return parcoursChoisis.reduce((accumulator: number, current: ParcoursChoisi) => {
      if (current.etatDeValidation == EtatsValidationParcours.VALIDE || current.etatDeValidation == EtatsValidationParcours.REJETE) {
        accumulator++
      }

      return accumulator;
    }, 0)
  }
}