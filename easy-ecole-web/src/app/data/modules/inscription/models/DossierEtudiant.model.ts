import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { Echeance } from "./Echeance.model"

export class DossierEtudiant {
  declare id?: string
  declare utilisateurId?: string
  declare matricule?: string
  declare codeQR?: string
  declare photo?: string
  declare statut?: 'actif' | 'suspendu' | 'archive'
  declare dateCreation?: Date
  declare fraisScolarite?: number
  declare modePaiement?: 'unique' | 'mensuel'
  declare nbMensualites?: number
  declare demarrageParcours?: Date
  declare utilisateur?: Utilisateur
  declare echeances?: Echeance[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
