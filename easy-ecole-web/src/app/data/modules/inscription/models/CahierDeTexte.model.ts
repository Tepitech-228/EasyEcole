import { Enseignant } from "../../auth/models/Enseignant.model"
import { BlocCahierDeTexte } from "./BlocCahierDeTexte.model"
import { Cours } from "./Cours.model"
import { Parcours } from "./Parcours.model"
import { NiveauEtude } from "./NiveauEtude.model"

export class CahierDeTexte {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare coursId?: string
  declare cours?: Cours
  declare parcoursId?: string
  declare parcours?: Parcours
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  declare etablissementId?: string
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare blocsCahierDeTexte?: BlocCahierDeTexte[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}