import { Ressource } from "./Ressource.model";

export class FichierRessource {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare fichier?: string
  declare ressourceId?: string
  declare ressource?: Ressource

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
