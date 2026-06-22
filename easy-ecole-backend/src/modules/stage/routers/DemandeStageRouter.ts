import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import DemandeStageController from "../controllers/DemandeStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/demandes:
     *   get:
     *     tags: [Demandes de stage]
     *     summary: Liste toutes les demandes de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des demandes de stage
     */
    .get('/', [Authenticate], DemandeStageController.getAll)
    /**
     * @openapi
     * /stages/demandes/{id}:
     *   get:
     *     tags: [Demandes de stage]
     *     summary: Récupère une demande de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la demande de stage
     */
    .get('/:id', [Authenticate], DemandeStageController.get)
    /**
     * @openapi
     * /stages/demandes:
     *   post:
     *     tags: [Demandes de stage]
     *     summary: Crée une nouvelle demande de stage
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
     *               offreStageId:
     *                 type: string
     *               message:
     *                 type: string
     *     responses:
     *       201:
     *         description: Demande de stage créée
     */
    .post('/', [Authenticate], DemandeStageController.create)
    /**
     * @openapi
     * /stages/demandes/valider/{id}:
     *   put:
     *     tags: [Demandes de stage]
     *     summary: Valide une demande de stage (approuvée par l'administration)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Demande de stage validée
     */
    .put('/valider/:id', [Authenticate], DemandeStageController.valider)
    /**
     * @openapi
     * /stages/demandes/rejeter/{id}:
     *   put:
     *     tags: [Demandes de stage]
     *     summary: Rejette une demande de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Demande de stage rejetée
     */
    .put('/rejeter/:id', [Authenticate], DemandeStageController.rejeter)
export default router;
