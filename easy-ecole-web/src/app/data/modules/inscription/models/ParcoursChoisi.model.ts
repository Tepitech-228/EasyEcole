import { EtatsValidationParcours } from "src/app/data/enums/EtatsValidationParcours";
import { DemandeInscription } from "./DemandeInscription.model";
import { Parcours } from "./Parcours.model";
import { PrerequisParcoursChoisi } from "./PrerequisParcoursChoisi.model";

export class ParcoursChoisi {
  declare id?: string
  declare etatDeValidation?: EtatsValidationParcours
  declare choixFinal?: boolean
  declare messageDeValidation?: string
  declare parcoursId?: string
  declare parcours?: Parcours
  declare demandeInscriptionId?: string
  declare demandeInscription?: DemandeInscription
  declare prerequisParcoursChoisis?: PrerequisParcoursChoisi[]
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}