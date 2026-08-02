import { Request, Response } from 'express'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'

/**
 * Middleware qui ajoute le scope etablissementId à la requête.
 * Les contrôleurs peuvent utiliser req.etablissementId pour filtrer leurs requêtes.
 * Les admins (ADMIN) voient toutes les données (etablissementId = null = pas de filtre).
 */
export default (req: Request, res: Response, next: Function) => {
    const role = (req as any).utilisateurRole
    const etablissementId = (req as any).etablissementId

    // Admin voit tout
    if (role === RolesUtilisateur.ADMIN) {
        return next()
    }

    // Si l'utilisateur n'a pas d'établissement, on bloque
    if (!etablissementId) {
        return res.status(403).json({
            success: false,
            message: "Aucun établissement rattaché à votre compte"
        })
    }

    return next()
}
