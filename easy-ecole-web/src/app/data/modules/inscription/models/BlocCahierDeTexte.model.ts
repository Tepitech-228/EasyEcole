import { CahierDeTexte } from "./CahierDeTexte.model";

export class BlocCahierDeTexte {
  declare id?: string
  declare date?: Date
  declare heureDebut?: Date
  declare heureFin?: Date
  declare contenu?: string

  declare cahierDeTexteId?: string
  declare cahierDeTexte?: CahierDeTexte

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}