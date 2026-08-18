import { Utilisateur } from "./Utilisateur.model";

export class PersonnelAdministratif {
  declare id?: string
  declare photo?: string
  declare matricule?: string
  declare dateNaissance?: Date
  declare lieuNaissance?: string
  declare sexe?: string
  declare nationalite?: string
  declare contact?: string
  declare cni?: string
  declare nifOtr?: string
  declare plusHautDiplome?: string
  declare statut?: string
  declare fonction?: string
  declare directionService?: string
  declare statutHandicap?: boolean
  declare natureHandicap?: string
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
