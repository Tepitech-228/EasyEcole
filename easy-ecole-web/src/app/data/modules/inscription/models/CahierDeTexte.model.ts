import { Enseignant } from "../../auth/models/Enseignant.model"
import { BlocCahierDeTexte } from "./BlocCahierDeTexte.model"
import { Cours } from "./Cours.model"

export class CahierDeTexte {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare coursId?: string
  declare cours?: Cours
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare blocsCahierDeTexte?: BlocCahierDeTexte[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}