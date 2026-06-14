import { AnneesParcours } from "src/app/data/enums/AnneesParcours";
import { SemestresParcours } from "src/app/data/enums/SemestresParcours";
import { Enseignant } from "../../auth/models/Enseignant.model";
import { ChapitreCours } from "./ChapitreCours.model";
import { Classe } from "./Classe.model";
import { Parcours } from "./Parcours.model";
import { Seance } from "./Seance.model";

export class Cours {
  declare id?: string
  declare code?: string
  declare intitule?: string
  declare credit?: number
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

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}