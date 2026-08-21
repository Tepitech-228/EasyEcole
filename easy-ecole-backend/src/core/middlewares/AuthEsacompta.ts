import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthEsacompta = (req: Request, res: Response, next: Function) => {
    if((req as any).utilisateurRole == RolesUtilisateur.ESA_COMPTA || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
        return next()
    }
    else {
        return res.status(403).json({success: false})
    }
}
