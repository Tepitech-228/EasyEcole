import { TypesRessource } from "src/app/data/enums/TypesRessource";
import { ChapitreCours } from "./ChapitreCours.model";
import { FichierRessource } from "./FichierRessource.model";

export class Ressource {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare type?: TypesRessource
  declare dateDebut?: Date
  declare dateFin?: Date
  declare active?: boolean
  declare fichiersRessource?: FichierRessource[]
  declare chapitreCoursId?: string
  declare chapitreCours?: ChapitreCours

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}