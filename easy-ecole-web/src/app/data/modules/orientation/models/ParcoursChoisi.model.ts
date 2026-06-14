import { EtatsValidationParcours } from "src/app/data/enums/EtatsValidationParcours";
import { DemandeOrientation } from "./DemandeOrientation.model";
import { Parcours } from "./Parcours.model";
import { PrerequisParcoursChoisi } from "./PrerequisParcoursChoisi.model";

export class ParcoursChoisi {
  declare id?: string
  declare etatDeValidation?: EtatsValidationParcours
  declare messageDeValidation?: string
  declare parcoursId?: string
  declare parcours?: Parcours
  declare demandeOrientationId?: string
  declare demandeOrientation?: DemandeOrientation
  declare prerequisParcoursChoisis?: PrerequisParcoursChoisi[]
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}