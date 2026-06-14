import { EtatsCoursChoisi } from "src/app/data/enums/EtatsCoursChoisi"
import { Cours } from "./Cours.model"
import { DemandeInscription } from "./DemandeInscription.model"

export class DemandeInscriptionCours {
  declare coursId?: string
  declare demandeInscriptionId?: string
  declare etat?: EtatsCoursChoisi

  declare cours?: Cours
  declare demandeInscription?: DemandeInscription

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}