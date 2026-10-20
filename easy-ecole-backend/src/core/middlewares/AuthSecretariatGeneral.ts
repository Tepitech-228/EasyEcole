import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthSecretariatGeneral = (req: Request, res: Response, next: Function) => {
  if (req.utilisateurRole === RolesUtilisateur.INSTITUTION) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Action réservée au Secrétariat général" });
}
