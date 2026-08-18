import { SemestresParcours } from "src/app/data/enums/SemestresParcours";
import { Enseignant } from "../../auth/models/Enseignant.model";
import { ChapitreCours } from "./ChapitreCours.model";
import { Classe } from "./Classe.model";
import { Parcours } from "./Parcours.model";
import { Seance } from "./Seance.model";
import { ListePresence } from "./ListePresence.model";
import { Ecue } from "./Ecue.model";

export class Cours {
  declare id?: string
  declare code?: string
  declare intitule?: string
  declare credit?: number
  declare creditEcts?: number
  declare objectifs?: string
  declare estObligatoire?: boolean
  declare description?: string
  declare semestre?: SemestresParcours
  declare classeId?: string
  declare classe?: Classe
  declare parcoursId?: string
  declare parcours?: Parcours
  declare chapitresCours?: ChapitreCours[]
  declare seances?: Seance[]

  declare enseignantId?: string
  declare enseignant?: Enseignant

  declare listesPresences?: ListePresence[]

  declare ecues?: Ecue[]

  declare volumeHoraire?: number
  declare coefficient?: number

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}