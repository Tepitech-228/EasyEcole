import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthPilotagePedagogique = (req: Request, res: Response, next: Function) => {
    const role = (req as any).utilisateurRole;
    if (
        role === RolesUtilisateur.INSTITUTION ||
        role === RolesUtilisateur.ADMIN ||
        role === RolesUtilisateur.SUPERVISEUR_GENERAL
    ) {
        return next();
    }
    return res.status(403).json({ success: false, message: "Accès réservé au pilotage pédagogique" });
};
