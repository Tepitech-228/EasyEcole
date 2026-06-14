import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { Cours } from "./Cours.model"
import { CursusApprenant } from "./CursusApprenant.model"

export class CoursParticipant {
    declare id?: string
    declare coursId?: string
    declare utilisateurId?: string
    declare cursusApprenantId?: string
  
    declare cours?: Cours
    declare utilisateur?: Utilisateur
    declare cursusApprenant?: CursusApprenant
  
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
  }