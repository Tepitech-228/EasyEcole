import { Utilisateur } from "../../auth/models/Utilisateur.model";

export class Pointage {
  declare id?: string
  declare date: Date
  declare heureArrivee: string
  declare heureDepart?: string

  declare utilisateurId: string
  declare utilisateur?: Utilisateur
  declare scans?: { id?: string; heure: string }[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
