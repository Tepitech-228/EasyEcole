import { NextFunction, Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthSuperviseurGeneralOuAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.utilisateurRole === RolesUtilisateur.SUPERVISEUR_GENERAL
    || req.utilisateurRole === RolesUtilisateur.ADMIN
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Action réservée au Superviseur général ou à l'administration",
  });
};
