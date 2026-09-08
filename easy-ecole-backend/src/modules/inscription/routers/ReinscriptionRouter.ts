import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"

import ReinscriptionController from "../controllers/ReinscriptionController"

const router = express.Router()

// Stockage des fichiers de réinscription (6 documents + bordereau de paiement)
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir = "public/inscription/reinscription/dossiers/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const ext = path.extname(file.originalname) || '.pdf'
        const name = require('crypto').randomBytes(16).toString('hex') + ext
        callback(null, name)
    },
})
const upload = multer({ storage })

const REINSCRIPTION_FIELDS = [
    { name: 'demande_dg', maxCount: 1 },
    { name: 'autorisation_provisoire', maxCount: 1 },
    { name: 'releves_notes', maxCount: 1 },
    { name: 'cni', maxCount: 1 },
    { name: 'quitus_bordereaux_annee', maxCount: 1 },
    { name: 'bordereau_nouvelle_annee', maxCount: 1 },
    { name: 'bordereau', maxCount: 1 },
]

/**
 * @openapi
 * /inscription/reinscription/peut-se-reinscrire:
 *   get:
 *     tags: [Réinscription]
 *     summary: Vérifie la solvabilité de l'étudiant (dette affichée, non bloquante)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 */
router.get('/peut-se-reinscrire', ReinscriptionController.peutSeReinscrire)

/**
 * @openapi
 * /inscription/reinscription/eligibilite:
 *   get:
 *     tags: [Réinscription]
 *     summary: Éligibilité à la réinscription planifiée (cursus actuel + dette + déjà inscrit)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Éligibilité
 */
router.get('/eligibilite', ReinscriptionController.getEligibilite)

/**
 * @openapi
 * /inscription/reinscription/soumettre:
 *   post:
 *     tags: [Réinscription]
 *     summary: Soumet un dossier de réinscription complet (6 documents + bordereau) dans le pipeline
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId: { type: string }
 *               classeId: { type: string }
 *               niveauEtudeId: { type: string }
 *               montant: { type: number }
 *               referenceBancaire: { type: string }
 *               modalite: { type: string }
 *               demande_dg: { type: string, format: binary }
 *               autorisation_provisoire: { type: string, format: binary }
 *               releves_notes: { type: string, format: binary }
 *               cni: { type: string, format: binary }
 *               quitus_bordereaux_annee: { type: string, format: binary }
 *               bordereau_nouvelle_annee: { type: string, format: binary }
 *               bordereau: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Dossier de réinscription créé
 */
router.post('/soumettre', upload.fields(REINSCRIPTION_FIELDS), ReinscriptionController.soumettre)

/**
 * @openapi
 * /inscription/reinscription/planifier:
 *   post:
 *     tags: [Réinscription]
 *     summary: Crée une planification de réinscription (en_attente)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Planification créée
 */
router.post('/planifier', ReinscriptionController.creerPlanification)

/**
 * @openapi
 * /inscription/reinscription/planifications:
 *   get:
 *     tags: [Réinscription]
 *     summary: Liste les planifications de l'apprenant connecté (suivi)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Liste des planifications
 */
router.get('/planifications', ReinscriptionController.getMesPlanifications)

/**
 * @openapi
 * /inscription/reinscription/planifications/{id}/annuler:
 *   post:
 *     tags: [Réinscription]
 *     summary: Annule une planification (en_attente -> abandon)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Planification annulée
 */
router.post('/planifications/:id/annuler', ReinscriptionController.annulerPlanification)

/**
 * @openapi
 * /inscription/reinscription/planifications/{id}/confirmer:
 *   post:
 *     tags: [Réinscription]
 *     summary: Confirme une planification (réservé admin/institution)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Planification confirmée
 */
router.post('/planifications/:id/confirmer', ReinscriptionController.confirmerPlanification)

export default router
