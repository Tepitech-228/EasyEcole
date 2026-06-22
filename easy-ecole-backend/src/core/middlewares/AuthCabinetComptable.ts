import { Request, Response } from "express";
import { RolesUtilisateur } from "../enums/RolesUtilisateur";

export const AuthCabinetComptable = (req: Request, res: Response, next: Function) => {
    if((req as any).utilisateurRole == RolesUtilisateur.CABINET_COMPTABLE) {
        return next()
    }
    else {
        return res.status(403).json({success: false})
    }
}
