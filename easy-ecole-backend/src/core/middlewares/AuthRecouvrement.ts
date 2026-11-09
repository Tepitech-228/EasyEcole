import { Request, Response, NextFunction } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const ROLES_RECOUVREMENT = [
    RolesUtilisateur.ESA_COMPTA,
    RolesUtilisateur.INSTITUTION,
    RolesUtilisateur.ADMIN,
] as const;

export function AuthRecouvrement(req: Request, res: Response, next: NextFunction): void {
    const role = (req as any).utilisateurRole;
    if (ROLES_RECOUVREMENT.includes(role)) {
        next();
        return;
    }
    res.status(403).json({ success: false, message: "Accès réservé au service de recouvrement" });
}
