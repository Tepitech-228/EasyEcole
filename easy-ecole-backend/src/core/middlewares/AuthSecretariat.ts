import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

/**
 * Accès au module Secrétariat : secrétaire, personnel administratif, admin.
 */
export const AuthSecretariat = (req: Request, res: Response, next: Function) => {
    const role = (req as any).utilisateurRole;
    if (role == RolesUtilisateur.SECRETAIRE
        || role == RolesUtilisateur.PERSONNEL_ADMINISTRATIF
        || role == RolesUtilisateur.ADMIN) {
        return next();
    }
    return res.status(403).json({ success: false, message: "Accès réservé au secrétariat" });
}
