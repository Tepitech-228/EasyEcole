import { CursusApprenant } from "./CursusApprenant.model";
import { Utilisateur } from "../../auth/models/Utilisateur.model";

export type DesignationMemoireStatut = 'propose' | 'confirme' | 'rejete'

export class DesignationMemoire {
  declare id?: string
  declare cursusApprenantId?: string
  declare sujet?: string
  declare superviseurId?: string
  declare gradeSuperviseur?: string
  declare emailSuperviseur?: string
  declare telephoneSuperviseur?: string
  declare dateDesignation?: string
  declare statut?: DesignationMemoireStatut
  declare commentaire?: string | null

  declare cursusApprenant?: CursusApprenant
  declare superviseur?: Utilisateur

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
