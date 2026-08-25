import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'
import { JWT_SECRET } from '../config/jwt'
import { Utilisateur } from '../../modules/auth/models/Utilisateur'

/**
 * Chemins autorisés à accepter le token JWT en query string (?token=).
 * Un token en query string fuite via les logs (morgan « dev » logge la ligne
 * de requête complète), l'historique navigateur et les referrers : il est donc
 * réservé aux seuls téléchargements ouverts dans un nouvel onglet / iframe /
 * <a href> où l'intercepteur HTTP Angular ne peut pas attacher le header
 * Authorization. Toutes les autres routes n'acceptent le token que via le
 * header Authorization (?token= est ignoré).
 *
 * Usage front vérifié par grep (easy-ecole-web, services/components) :
 *   - ged.service.ts → getDownloadUrlWithToken → /api/v1/ged/documents/download/:id
 *   - bibliotheque.service.ts → getDownloadUrl → /api/v1/scolarite/bibliotheque/download/:id
 *   - dossier-etudiant.service.ts → telechargerCarteUrl → /api/v1/inscription/dossiers/:id/carte
 *   - paiements-page / paiements-section → /api/v1/inscription/paiementsInscription/:id/recu
 *   - paiements-section → /api/v1/inscription/demandesInscription/:id/fiche-paiement
 *   - bordereaux-page / validation-bordereaux-page → /api/v1/inscription/bordereaux/... (affichage média + download)
 *   - comite-validation-page → /api/v1/inscription/documents/:id/download (pièces justificatives d'inscription)
 *   - deliberation.service.ts → telechargerPV → /api/v1/inscription/deliberations/pv/:filename
 */
const QUERY_TOKEN_ALLOWED: string[][] = [
    ['/ged/'],
    ['/scolarite/bibliotheque/download/'],
    ['/inscription/dossiers/', '/carte'],
    ['/paiementsInscription/', '/recu'],
    ['/demandesInscription/', '/fiche-paiement'],
    ['/inscription/bordereaux/'],
    ['/inscription/documents/', '/download'],
    ['/deliberations/pv/'],]

function isQueryTokenAllowed(originalUrl: string): boolean {
    if (!originalUrl.startsWith('/api/v1')) return false
    return QUERY_TOKEN_ALLOWED.some(parts => parts.every(part => originalUrl.includes(part)))
}

export default async (req: Request, res: Response, next: Function) => {
    if (req.method === 'OPTIONS') {
        return next()
    }
    let accessToken: string | null = null;
    if (req.headers['authorization']) {
        accessToken = req.headers.authorization.split(' ')[1];
    } else if (req.query.token && isQueryTokenAllowed(req.originalUrl)) {
        accessToken = req.query.token as string;
    }
    if (!accessToken) {
        return res.status(401).json({ success: false, message: 'No access token provided' })
    }

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
        req.etablissementId = (decoded as any).etablissementId || null;

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
    etablissementId?: number | null
}
