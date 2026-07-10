import { RolesUtilisateur } from "../enums/RolesUtilisateur";

declare module "express-serve-static-core" {
  interface Request {
    utilisateurId?: number;
    utilisateurIdentifiant?: string;
    utilisateurEmail?: string;
    utilisateurRole?: RolesUtilisateur;
  }
}
