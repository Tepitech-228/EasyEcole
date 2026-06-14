import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthEnseignant = (req: Request, res: Response, next: Function) => {
    if((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
        return next()
    }
    else {
        return res.status(403).json({success: false})
    }
}