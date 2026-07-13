import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportStageController from "../controllers/RapportStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/rapports:
     *   get:
     *     tags: [Rapports de stage]
     *     summary: Liste tous les rapports de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des rapports de stage
     */
    .get('/', [Authenticate], RapportStageController.getAll)
    /**
     * @openapi
     * /stages/rapports/{id}:
     *   get:
     *     tags: [Rapports de stage]
     *     summary: Récupère un rapport de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du rapport de stage
     */
    .get('/:id', [Authenticate], RapportStageController.get)
    /**
     * @openapi
     * /stages/rapports:
     *   post:
     *     tags: [Rapports de stage]
     *     summary: Crée un nouveau rapport de stage
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
     *               contenu:
     *                 type: string
     *     responses:
     *       201:
     *         description: Rapport de stage créé
     */
    .post('/', [Authenticate], RapportStageController.create)
    /**
     * @openapi
     * /stages/rapports/{id}:
     *   put:
     *     tags: [Rapports de stage]
     *     summary: Met à jour un rapport de stage
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
     *               contenu:
     *                 type: string
     *     responses:
     *       200:
     *         description: Rapport de stage mis à jour
     */
    .put('/:id', [Authenticate], RapportStageController.update)
    /**
     * @openapi
     * /stages/rapports/{id}:
     *   delete:
     *     tags: [Rapports de stage]
     *     summary: Supprime un rapport de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Rapport de stage supprimé
     */
    .delete('/:id', [Authenticate], RapportStageController.delete)
export default router;
