import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import NoteStageController from "../controllers/NoteStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/notes:
     *   get:
     *     tags: [Notes de stage]
     *     summary: Liste toutes les notes de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des notes de stage
     */
    .get('/', [Authenticate], NoteStageController.getAll)
    /**
     * @openapi
     * /stages/notes/{id}:
     *   get:
     *     tags: [Notes de stage]
     *     summary: Récupère une note de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la note de stage
     */
    .get('/:id', [Authenticate], NoteStageController.get)
    /**
     * @openapi
     * /stages/notes:
     *   post:
     *     tags: [Notes de stage]
     *     summary: Crée une nouvelle note de stage
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
     *               note:
     *                 type: number
     *               appreciation:
     *                 type: string
     *     responses:
     *       201:
     *         description: Note de stage créée
     */
    .post('/', [Authenticate], NoteStageController.create)
    /**
     * @openapi
     * /stages/notes/{id}:
     *   put:
     *     tags: [Notes de stage]
     *     summary: Met à jour une note de stage
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
     *               note:
     *                 type: number
     *               appreciation:
     *                 type: string
     *     responses:
     *       200:
     *         description: Note de stage mise à jour
     */
    .put('/:id', [Authenticate], NoteStageController.update)
    /**
     * @openapi
     * /stages/notes/{id}:
     *   delete:
     *     tags: [Notes de stage]
     *     summary: Supprime une note de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Note de stage supprimée
     */
    .delete('/:id', [Authenticate], NoteStageController.delete)
export default router;
