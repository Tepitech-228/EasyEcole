import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MouvementStockController from "../controllers/MouvementStockController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/mouvements:
     *   get:
     *     tags: [Mouvements de stock]
     *     summary: Liste tous les mouvements de stock
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des mouvements de stock
     */
    .get('/', [Authenticate], MouvementStockController.getAll)
    /**
     * @openapi
     * /stocks/mouvements/{id}:
     *   get:
     *     tags: [Mouvements de stock]
     *     summary: Détail d'un mouvement de stock
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
     *         description: Détail du mouvement de stock
     */
    .get('/:id', [Authenticate], MouvementStockController.get)
    /**
     * @openapi
     * /stocks/mouvements:
     *   post:
     *     tags: [Mouvements de stock]
     *     summary: Crée un mouvement de stock
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
     *         description: Mouvement de stock créé
     */
    .post('/', [Authenticate], MouvementStockController.create)
    /**
     * @openapi
     * /stocks/mouvements/{id}:
     *   put:
     *     tags: [Mouvements de stock]
     *     summary: Met à jour un mouvement de stock
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
     *         description: Mouvement de stock mis à jour
     */
    .put('/:id', [Authenticate], MouvementStockController.update)
    /**
     * @openapi
     * /stocks/mouvements/{id}:
     *   delete:
     *     tags: [Mouvements de stock]
     *     summary: Supprime un mouvement de stock
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
     *         description: Mouvement de stock supprimé
     */
    .delete('/:id', [Authenticate], MouvementStockController.delete)
export default router;
