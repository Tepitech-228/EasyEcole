import express from "express"
import multer from "multer"

import BordereauController from "../controllers/BordereauController"
import { AuthCabinetComptable } from "../../../core/middlewares/AuthCabinetComptable";

const upload = multer({ dest: "public/inscription/bordereaux/" });
const router = express.Router()

router
    /**
     * @openapi
     * /inscription/bordereaux:
     *   get:
     *     tags: [Bordereaux]
     *     summary: Liste tous les bordereaux (filtré par étudiant pour apprenant)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: statut
     *         schema:
     *           type: string
     *           enum: [en_attente, valide, rejete]
     *         description: Filtrer par statut
     *       - in: query
     *         name: echeanceId
     *         schema:
     *           type: string
     *         description: Filtrer par échéance
     *     responses:
     *       200:
     *         description: Liste des bordereaux
     */
    .get('/', BordereauController.getAllBordereaux)
    /**
     * @openapi
     * /inscription/bordereaux/{id}:
     *   get:
     *     tags: [Bordereaux]
     *     summary: Récupère un bordereau par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du bordereau
     */
    .get('/:id', BordereauController.getBordereau)
    /**
     * @openapi
     * /inscription/bordereaux:
     *   post:
     *     tags: [Bordereaux]
     *     summary: Upload un bordereau de paiement (apprenant uniquement)
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - echeanceId
     *               - fichier
     *               - montant
     *             properties:
     *               echeanceId:
     *                 type: string
     *               fichier:
     *                 type: string
     *                 format: binary
     *               montant:
     *                 type: number
     *               referenceBancaire:
     *                 type: string
     *     responses:
     *       201:
     *         description: Bordereau créé
     */
    .post('/', [upload.fields([{name: 'fichier', maxCount: 1}])], BordereauController.createBordereau)
    /**
     * @openapi
     * /inscription/bordereaux/{id}/valider:
     *   put:
     *     tags: [Bordereaux]
     *     summary: Valide un bordereau (cabinet comptable uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               commentaire:
     *                 type: string
     *     responses:
     *       200:
     *         description: Bordereau validé
     */
    .put('/:id/valider', [AuthCabinetComptable], BordereauController.validerBordereau)
    /**
     * @openapi
     * /inscription/bordereaux/{id}/rejeter:
     *   put:
     *     tags: [Bordereaux]
     *     summary: Rejette un bordereau (cabinet comptable uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - commentaire
     *             properties:
     *               commentaire:
     *                 type: string
     *     responses:
     *       200:
     *         description: Bordereau rejeté
     */
    .put('/:id/rejeter', [AuthCabinetComptable], BordereauController.rejeterBordereau)

export default router
