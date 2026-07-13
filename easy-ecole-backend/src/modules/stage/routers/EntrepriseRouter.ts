import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import EntrepriseController from "../controllers/EntrepriseController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/entreprises:
     *   get:
     *     tags: [Entreprises]
     *     summary: Liste toutes les entreprises partenaires
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des entreprises
     */
    .get('/', [Authenticate], EntrepriseController.getAll)
    /**
     * @openapi
     * /stages/entreprises/{id}:
     *   get:
     *     tags: [Entreprises]
     *     summary: Récupère une entreprise par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'entreprise
     */
    .get('/:id', [Authenticate], EntrepriseController.get)
    /**
     * @openapi
     * /stages/entreprises:
     *   post:
     *     tags: [Entreprises]
     *     summary: Crée une nouvelle entreprise
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
     *               adresse:
     *                 type: string
     *               telephone:
     *                 type: string
     *               email:
     *                 type: string
     *     responses:
     *       201:
     *         description: Entreprise créée
     */
    .post('/', [Authenticate], EntrepriseController.create)
    /**
     * @openapi
     * /stages/entreprises/{id}:
     *   put:
     *     tags: [Entreprises]
     *     summary: Met à jour une entreprise
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
     *               adresse:
     *                 type: string
     *               telephone:
     *                 type: string
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Entreprise mise à jour
     */
    .put('/:id', [Authenticate], EntrepriseController.update)
    /**
     * @openapi
     * /stages/entreprises/{id}:
     *   delete:
     *     tags: [Entreprises]
     *     summary: Supprime une entreprise
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Entreprise supprimée
     */
    .delete('/:id', [Authenticate], EntrepriseController.delete)
export default router;
