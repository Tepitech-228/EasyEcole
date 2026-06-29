import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'
import { JWT_SECRET } from '../config/jwt'

export default (req: Request, res: Response, next: Function) => {
    if (!req.headers['authorization']) {
        return res.status(400).json({ success: false, message: 'No access token provided' })
    }

    const accessToken = req.headers.authorization.split(' ')[1]

    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET) as unknown as EncodePayload
        ;(req as any).utilisateurId = decoded.id;
        ;(req as any).utilisateurIdentifiant = decoded.identifiant;
        ;(req as any).utilisateurEmail = decoded.email;
        ;(req as any).utilisateurRole = decoded.role;

        return next()
    } catch (error: any) {
        return res.status(401).json({ success: false, message: error.message })
    }
}

export interface EncodePayload {
    id: number,
    // nom: string,
    // prenoms: string,
    identifiant: string,
    email: string
    role: RolesUtilisateur
}