import express from "express"
import EngagementController from "../controllers/EngagementController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/engagements:
     *   get:
     *     tags: [Achats - Engagements]
     *     summary: Liste tous les engagements budgétaires
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des engagements
     */
    .get('/', EngagementController.getAll)
    /**
     * @openapi
     * /achats/engagements:
     *   post:
     *     tags: [Achats - Engagements]
     *     summary: Crée un engagement budgétaire
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               budgetId:
     *                 type: integer
     *               demandeId:
     *                 type: integer
     *               montant:
     *                 type: number
     *     responses:
     *       201:
     *         description: Engagement créé
     */
    .post('/', EngagementController.create)
    /**
     * @openapi
     * /achats/engagements/{id}/liberer:
     *   put:
     *     tags: [Achats - Engagements]
     *     summary: Libère un engagement budgétaire
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Engagement libéré
     */
    .put('/:id/liberer', EngagementController.liberer)

export default router
