import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import TuteurController from "../controllers/TuteurController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/tuteurs:
     *   get:
     *     tags: [Tuteurs]
     *     summary: Liste tous les tuteurs de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des tuteurs
     */
    .get('/', [Authenticate], TuteurController.getAll)
    /**
     * @openapi
     * /stages/tuteurs/{id}:
     *   get:
     *     tags: [Tuteurs]
     *     summary: Récupère un tuteur par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du tuteur
     */
    .get('/:id', [Authenticate], TuteurController.get)
    /**
     * @openapi
     * /stages/tuteurs:
     *   post:
     *     tags: [Tuteurs]
     *     summary: Crée un nouveau tuteur de stage
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nom:
     *                 type: string
     *               email:
     *                 type: string
     *               telephone:
     *                 type: string
     *               entrepriseId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Tuteur créé
     */
    .post('/', [Authenticate], TuteurController.create)
    /**
     * @openapi
     * /stages/tuteurs/{id}:
     *   put:
     *     tags: [Tuteurs]
     *     summary: Met à jour un tuteur de stage
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
     *               nom:
     *                 type: string
     *               email:
     *                 type: string
     *               telephone:
     *                 type: string
     *     responses:
     *       200:
     *         description: Tuteur mis à jour
     */
    .put('/:id', [Authenticate], TuteurController.update)
    /**
     * @openapi
     * /stages/tuteurs/{id}:
     *   delete:
     *     tags: [Tuteurs]
     *     summary: Supprime un tuteur de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Tuteur supprimé
     */
    .delete('/:id', [Authenticate], TuteurController.delete)
export default router;
