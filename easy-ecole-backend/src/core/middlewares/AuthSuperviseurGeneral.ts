import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthSuperviseurGeneral = (req: Request, res: Response, next: Function) => {
  if (req.utilisateurRole === RolesUtilisateur.SUPERVISEUR_GENERAL) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Action réservée au Superviseur général" });
}
