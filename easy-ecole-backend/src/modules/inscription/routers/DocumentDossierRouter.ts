import express from "express"

import DocumentDossierController from "../controllers/DocumentDossierController"

/**
 * Service des fichiers des pièces justificatives d'inscription.
 * Monté sous /inscription/documents (voir InscriptionRoutes.ts).
 *
 * Le téléchargement se fait par ID d'enregistrement (ins_dossiers_demandes) ;
 * l'authentification est assurée par Authenticate au montage — le token JWT est
 * accepté en query string (?token=) pour cet URL précis, voir la liste blanche
 * QUERY_TOKEN_ALLOWED dans core/middlewares/Authenticate.ts (nécessaire pour
 * iframe / <a href target=_blank> qui ne peuvent pas porter le header Authorization).
 */
const router = express.Router()

router
    /**
     * @openapi
     * /inscription/documents/download:
     *   get:
     *     tags: [Documents Inscription]
     *     summary: Télécharge / affiche inline une pièce justificative d'inscription
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: demandeId
     *         required: true
     *         schema: { type: integer }
     *       - in: query
     *         name: dossierId
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Fichier (PDF ou image), servi en inline
     *       400:
     *         description: Paramètres manquants
     *       404:
     *         description: Document ou fichier introuvable
     */
    .get('/download', DocumentDossierController.download)

export default router
