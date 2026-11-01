import { Request, Response } from "express"
import path from "path"
import fs from "fs"

import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier"
import { DemandeInscription } from "../models/DemandeInscription"
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur"

const ROLES_INTERNES_DOSSIERS: string[] = [
    RolesUtilisateur.SECRETAIRE,
    RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
    RolesUtilisateur.INSTITUTION,
    RolesUtilisateur.ADMIN,
    RolesUtilisateur.COMITE_ORIENTATION,
    RolesUtilisateur.SUPERVISEUR_GENERAL
]

/**
 * Service des pièces justificatives d'inscription (table ins_dossiers_demandes).
 *
 * Particularité : cette table n'a PAS de colonne id — sa clé primaire est le
 * couple (demandeId, dossierId). Le modèle Sequelize ajoute un attribut `id`
 * automatique qui n'existe pas en base ; toute requête doit donc exclure cet
 * attribut sous peine d'erreur SQL « Champ 'id' inconnu ».
 *
 * Le champ nomFichier a contenu, selon l'époque :
 *   - un nom de fichier plat (ex : 2293...pdf) déposé dans public/inscription/dossiers/
 *   - un chemin relatif complet vers la nouvelle arborescence par dossier étudiant
 *     (ex : public/dossiers/2025-2026/MASTER/ECO-M1-A/Master 1/88354938/dossiers/2293...pdf)
 * Les deux formes sont résolues ici, même logique que BordereauController.downloadBordereau.
 */
export default class DocumentDossierController {

    static async download(req: Request, res: Response): Promise<void> {
        try {
            const demandeId = Number(req.query.demandeId)
            const dossierId = Number(req.query.dossierId)
            if (!Number.isInteger(demandeId) || !Number.isInteger(dossierId) || demandeId <= 0 || dossierId <= 0) {
                res.status(400).json({ success: false, message: "Paramètres demandeId et dossierId requis" })
                return
            }

            const demande = await DemandeInscription.findByPk(demandeId)
            if (!demande) {
                res.status(404).json({ success: false, message: "Demande non trouvée" })
                return
            }
            const role = (req as any).utilisateurRole
            const proprietaire = role === RolesUtilisateur.APPRENANT
                && Number(demande.utilisateurId) === Number((req as any).utilisateurId)
            if (!proprietaire && !ROLES_INTERNES_DOSSIERS.includes(role)) {
                res.status(403).json({ success: false })
                return
            }

            const doc = await DemandeInscriptionDossier.findOne({
                where: { demandeId, dossierId },
                attributes: { exclude: ['id'] },
            })
            if (!doc || !doc.nomFichier) {
                res.status(404).json({ success: false, message: "Document non trouvé" })
                return
            }

            const publicRoot = path.resolve(process.cwd(), 'public')
            const estDansPublic = (candidat: string): boolean =>
                candidat.startsWith(`${publicRoot}${path.sep}`)

            // 1) chemin relatif complet stocké en base (nouvelle structure), 2) ancien dépôt plat
            let filePath = path.resolve(process.cwd(), doc.nomFichier)
            if (!estDansPublic(filePath) || !fs.existsSync(filePath)) {
                filePath = path.resolve(process.cwd(), 'public/inscription/dossiers', path.basename(doc.nomFichier))
            }
            if (!estDansPublic(filePath) || !fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier introuvable sur le serveur" })
                return
            }

            const ext = path.extname(filePath).toLowerCase() || '.pdf'
            const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
            }
            const contentType = mimeTypes[ext] || 'application/octet-stream'

            res.removeHeader('X-Frame-Options')
            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

            const stream = fs.createReadStream(filePath)
            stream.on('error', () => {
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
                } else {
                    res.end()
                }
            })
            stream.pipe(res)
        } catch (error) {
            console.error('[DocumentDossier][download]', error)
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: "Erreur lors de la récupération du document" })
            }
        }
    }
}
