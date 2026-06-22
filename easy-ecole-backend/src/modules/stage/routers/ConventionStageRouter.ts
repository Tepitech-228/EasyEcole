import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ConventionStageController from "../controllers/ConventionStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/conventions:
     *   get:
     *     tags: [Conventions de stage]
     *     summary: Liste toutes les conventions de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des conventions
     */
    .get('/', [Authenticate], ConventionStageController.getAll)
    /**
     * @openapi
     * /stages/conventions/{id}:
     *   get:
     *     tags: [Conventions de stage]
     *     summary: Récupère une convention de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la convention
     */
    .get('/:id', [Authenticate], ConventionStageController.get)
    /**
     * @openapi
     * /stages/conventions:
     *   post:
     *     tags: [Conventions de stage]
     *     summary: Crée une nouvelle convention de stage
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
     *               entrepriseId:
     *                 type: string
     *               dateDebut:
     *                 type: string
     *                 format: date
     *               dateFin:
     *                 type: string
     *                 format: date
     *     responses:
     *       201:
     *         description: Convention créée
     */
    .post('/', [Authenticate], ConventionStageController.create)
    /**
     * @openapi
     * /stages/conventions/{id}:
     *   put:
     *     tags: [Conventions de stage]
     *     summary: Met à jour une convention de stage
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
     *               dateDebut:
     *                 type: string
     *                 format: date
     *               dateFin:
     *                 type: string
     *                 format: date
     *     responses:
     *       200:
     *         description: Convention mise à jour
     */
    .put('/:id', [Authenticate], ConventionStageController.update)
    /**
     * @openapi
     * /stages/conventions/{id}:
     *   delete:
     *     tags: [Conventions de stage]
     *     summary: Supprime une convention de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Convention supprimée
     */
    .delete('/:id', [Authenticate], ConventionStageController.delete)
export default router;
