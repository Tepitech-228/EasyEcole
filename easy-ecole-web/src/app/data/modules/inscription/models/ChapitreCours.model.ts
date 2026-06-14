import { Cours } from "./Cours.model";
import { Ressource } from "./Ressource.model";

export class ChapitreCours {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare image?: string
  declare coursId?: string
  declare cours?: Cours
  declare ressources?: Ressource[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}