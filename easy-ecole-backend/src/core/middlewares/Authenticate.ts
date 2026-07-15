import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'
import { JWT_SECRET } from '../config/jwt'
import { Utilisateur } from '../../modules/auth/models/Utilisateur'

export default async (req: Request, res: Response, next: Function) => {
    if (!req.headers['authorization']) {
        return res.status(400).json({ success: false, message: 'No access token provided' })
    }

    const accessToken = req.headers.authorization.split(' ')[1]

    try {
        const decoded = jwt.verify(accessToken, JWT_SECRET) as unknown as EncodePayload
        const user = await Utilisateur.findByPk(decoded.id, { attributes: ['tokenVersion'] })
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ success: false, message: 'Token invalide (session expirée)' })
        }
        req.utilisateurId = decoded.id;
        req.utilisateurIdentifiant = decoded.identifiant;
        req.utilisateurEmail = decoded.email;
        req.utilisateurRole = decoded.role;

        return next()
    } catch (error: any) {
        return res.status(401).json({ success: false, message: error.message })
    }
}

export interface EncodePayload {
    id: number,
    identifiant: string,
    email: string
    role: RolesUtilisateur
    tokenVersion: number
}
