import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AttestationStageController from "../controllers/AttestationStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/attestations:
     *   get:
     *     tags: [Attestations de stage]
     *     summary: Liste toutes les attestations de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des attestations
     */
    .get('/', [Authenticate], AttestationStageController.getAll)
    /**
     * @openapi
     * /stages/attestations/{id}:
     *   get:
     *     tags: [Attestations de stage]
     *     summary: Récupère une attestation de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'attestation
     */
    .get('/:id', [Authenticate], AttestationStageController.get)
    /**
     * @openapi
     * /stages/attestations:
     *   post:
     *     tags: [Attestations de stage]
     *     summary: Crée une nouvelle attestation de stage
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               etudiantId:
     *                 type: string
     *               stageId:
     *                 type: string
     *               dateDelivrance:
     *                 type: string
     *                 format: date
     *     responses:
     *       201:
     *         description: Attestation créée
     */
    .post('/', [Authenticate], AttestationStageController.create)
    /**
     * @openapi
     * /stages/attestations/{id}:
     *   put:
     *     tags: [Attestations de stage]
     *     summary: Met à jour une attestation de stage
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
     *             properties:
     *               dateDelivrance:
     *                 type: string
     *                 format: date
     *     responses:
     *       200:
     *         description: Attestation mise à jour
     */
    .put('/:id', [Authenticate], AttestationStageController.update)
    /**
     * @openapi
     * /stages/attestations/{id}:
     *   delete:
     *     tags: [Attestations de stage]
     *     summary: Supprime une attestation de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Attestation supprimée
     */
    .delete('/:id', [Authenticate], AttestationStageController.delete)
export default router;
