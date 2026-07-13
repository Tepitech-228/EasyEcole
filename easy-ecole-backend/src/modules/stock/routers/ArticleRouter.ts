import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ArticleController from "../controllers/ArticleController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/articles:
     *   get:
     *     tags: [Articles]
     *     summary: Liste tous les articles
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des articles
     */
    .get('/', [Authenticate], ArticleController.getAll)
    /**
     * @openapi
     * /stocks/articles/{id}:
     *   get:
     *     tags: [Articles]
     *     summary: Détail d'un article
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
     *         description: Détail de l'article
     */
    .get('/:id', [Authenticate], ArticleController.get)
    /**
     * @openapi
     * /stocks/articles:
     *   post:
     *     tags: [Articles]
     *     summary: Crée un article
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
     *         description: Article créé
     */
    .post('/', [Authenticate], ArticleController.create)
    /**
     * @openapi
     * /stocks/articles/{id}:
     *   put:
     *     tags: [Articles]
     *     summary: Met à jour un article
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
     *         description: Article mis à jour
     */
    .put('/:id', [Authenticate], ArticleController.update)
    /**
     * @openapi
     * /stocks/articles/{id}:
     *   delete:
     *     tags: [Articles]
     *     summary: Supprime un article
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
     *         description: Article supprimé
     */
    .delete('/:id', [Authenticate], ArticleController.delete)
export default router;
