import { NiveauEtude } from "./NiveauEtude.model";
import { Parcours } from "./Parcours.model";

export class Classe {
  declare id?: string
  declare libelle?: string
  declare description?: string
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  declare parcoursId?: string
  declare parcours?: Parcours

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}