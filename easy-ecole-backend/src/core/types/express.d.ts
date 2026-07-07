import { RolesUtilisateur } from "../enums/RolesUtilisateur";

declare global {
  namespace Express {
    interface Request {
      utilisateurId?: number;
      utilisateurIdentifiant?: string;
      utilisateurEmail?: string;
      utilisateurRole?: RolesUtilisateur;
    }
  }
}
