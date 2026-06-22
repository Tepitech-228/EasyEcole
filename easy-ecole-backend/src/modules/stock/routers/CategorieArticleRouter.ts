import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CategorieArticleController from "../controllers/CategorieArticleController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/categories:
     *   get:
     *     tags: [Catégories d'articles]
     *     summary: Liste toutes les catégories d'articles
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des catégories d'articles
     */
    .get('/', [Authenticate], CategorieArticleController.getAll)
    /**
     * @openapi
     * /stocks/categories/{id}:
     *   get:
     *     tags: [Catégories d'articles]
     *     summary: Détail d'une catégorie d'article
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
     *         description: Détail de la catégorie d'article
     */
    .get('/:id', [Authenticate], CategorieArticleController.get)
    /**
     * @openapi
     * /stocks/categories:
     *   post:
     *     tags: [Catégories d'articles]
     *     summary: Crée une catégorie d'article
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
     *         description: Catégorie d'article créée
     */
    .post('/', [Authenticate], CategorieArticleController.create)
    /**
     * @openapi
     * /stocks/categories/{id}:
     *   put:
     *     tags: [Catégories d'articles]
     *     summary: Met à jour une catégorie d'article
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
     *         description: Catégorie d'article mise à jour
     */
    .put('/:id', [Authenticate], CategorieArticleController.update)
    /**
     * @openapi
     * /stocks/categories/{id}:
     *   delete:
     *     tags: [Catégories d'articles]
     *     summary: Supprime une catégorie d'article
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
     *         description: Catégorie d'article supprimée
     */
    .delete('/:id', [Authenticate], CategorieArticleController.delete)
export default router;
