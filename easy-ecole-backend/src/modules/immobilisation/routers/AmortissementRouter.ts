import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AmortissementController from "../controllers/AmortissementController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/amortissements:
     *   get:
     *     tags: [Amortissements]
     *     summary: Liste tous les amortissements
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des amortissements
     */
    .get('/', [Authenticate], AmortissementController.getAll)
    /**
     * @openapi
     * /immobilisations/amortissements/{id}:
     *   get:
     *     tags: [Amortissements]
     *     summary: Détail d'un amortissement
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détail de l'amortissement
     */
    .get('/:id', [Authenticate], AmortissementController.get)
    /**
     * @openapi
     * /immobilisations/amortissements:
     *   post:
     *     tags: [Amortissements]
     *     summary: Crée un amortissement
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       201:
     *         description: Amortissement créé
     */
    .post('/', [Authenticate], AmortissementController.create)
    /**
     * @openapi
     * /immobilisations/amortissements/{id}:
     *   put:
     *     tags: [Amortissements]
     *     summary: Met à jour un amortissement
     *     security:
     *       - bearerAuth: []
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
     *     responses:
     *       200:
     *         description: Amortissement mis à jour
     */
    .put('/:id', [Authenticate], AmortissementController.update)
    /**
     * @openapi
     * /immobilisations/amortissements/{id}:
     *   delete:
     *     tags: [Amortissements]
     *     summary: Supprime un amortissement
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Amortissement supprimé
     */
    .delete('/:id', [Authenticate], AmortissementController.delete)
export default router;
