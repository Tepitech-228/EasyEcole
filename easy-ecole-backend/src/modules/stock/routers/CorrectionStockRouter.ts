import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CorrectionStockController from "../controllers/CorrectionStockController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/corrections-stock:
     *   get:
     *     tags: [Corrections de stock]
     *     summary: Liste toutes les corrections de stock
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des corrections de stock
     */
    .get('/', [Authenticate], CorrectionStockController.getAll)
    /**
     * @openapi
     * /stocks/corrections-stock/by-article/{articleId}:
     *   get:
     *     tags: [Corrections de stock]
     *     summary: Liste les corrections de stock d'un article
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: articleId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Liste des corrections de stock de l'article
     */
    .get('/by-article/:articleId', [Authenticate], CorrectionStockController.getByArticle)
    /**
     * @openapi
     * /stocks/corrections-stock/{id}:
     *   get:
     *     tags: [Corrections de stock]
     *     summary: Détail d'une correction de stock
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
     *         description: Détail de la correction de stock
     */
    .get('/:id', [Authenticate], CorrectionStockController.get)
    /**
     * @openapi
     * /stocks/corrections-stock:
     *   post:
     *     tags: [Corrections de stock]
     *     summary: Crée une correction de stock
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
     *         description: Correction de stock créée
     */
    .post('/', [Authenticate], CorrectionStockController.create)
    /**
     * @openapi
     * /stocks/corrections-stock/{id}:
     *   put:
     *     tags: [Corrections de stock]
     *     summary: Met à jour une correction de stock
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
     *         description: Correction de stock mise à jour
     */
    .put('/:id', [Authenticate], CorrectionStockController.update)
    /**
     * @openapi
     * /stocks/corrections-stock/{id}:
     *   delete:
     *     tags: [Corrections de stock]
     *     summary: Supprime une correction de stock
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
     *         description: Correction de stock supprimée
     */
    .delete('/:id', [Authenticate], CorrectionStockController.delete)
export default router;
