import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthApprenant = (req: Request, res: Response, next: Function) => {
    if((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
        return next()
    }
    else {
        return res.status(403).json({success: false})
    }
}