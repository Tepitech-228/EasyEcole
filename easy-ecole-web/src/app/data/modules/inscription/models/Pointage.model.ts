import { Utilisateur } from "../../auth/models/Utilisateur.model";

export class Pointage {
  declare id?: string
  declare date: Date
  declare heureArrivee: string
  declare heureDepart?: string

  declare utilisateurId: string
  declare utilisateur?: Utilisateur

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
