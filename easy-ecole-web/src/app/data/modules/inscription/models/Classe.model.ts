import { NiveauEtude } from "./NiveauEtude.model";

export class Classe {
  declare id?: string
  declare libelle?: string
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}