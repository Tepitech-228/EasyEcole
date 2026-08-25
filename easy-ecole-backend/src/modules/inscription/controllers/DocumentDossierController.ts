import { Request, Response } from "express"
import path from "path"
import fs from "fs"

import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier"

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

    static download(req: Request, res: Response): void {
        const demandeId = Number(req.query.demandeId)
        const dossierId = Number(req.query.dossierId)
        if (!Number.isInteger(demandeId) || !Number.isInteger(dossierId) || demandeId <= 0 || dossierId <= 0) {
            res.status(400).json({ success: false, message: "Paramètres demandeId et dossierId requis" })
            return
        }

        res.removeHeader('X-Frame-Options')
        DemandeInscriptionDossier.findOne({
            where: { demandeId, dossierId },
            attributes: { exclude: ['id'] },
        }).then((doc) => {
            if (!doc || !doc.nomFichier) {
                res.status(404).json({ success: false, message: "Document non trouvé" })
                return
            }

            // 1) chemin relatif complet stocké en base (nouvelle structure), 2) ancien dépôt plat
            let filePath = path.resolve(process.cwd(), doc.nomFichier)
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(process.cwd(), 'public/inscription/dossiers', path.basename(doc.nomFichier))
            }
            if (!fs.existsSync(filePath)) {
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

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

            const stream = fs.createReadStream(filePath)
            stream.on('error', () => {
                res.status(500).json({ success: false, message: "Erreur lors de la lecture du fichier" })
            })
            stream.pipe(res)
        }).catch(() => {
            res.status(500).json({ success: false, error: "Erreur lors de la récupération du document" })
        })
    }
}
