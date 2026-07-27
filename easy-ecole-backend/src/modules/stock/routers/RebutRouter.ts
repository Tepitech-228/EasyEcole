import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RebutController from "../controllers/RebutController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/rebuts:
     *   get:
     *     tags: [Rebuts]
     *     summary: Liste tous les rebuts
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des rebuts
     */
    .get('/', [Authenticate], RebutController.getAll)
    /**
     * @openapi
     * /stocks/rebuts/by-article/{articleId}:
     *   get:
     *     tags: [Rebuts]
     *     summary: Liste les rebuts d'un article
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
     *         description: Liste des rebuts de l'article
     */
    .get('/by-article/:articleId', [Authenticate], RebutController.getByArticle)
    /**
     * @openapi
     * /stocks/rebuts/{id}:
     *   get:
     *     tags: [Rebuts]
     *     summary: Détail d'un rebut
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
     *         description: Détail du rebut
     */
    .get('/:id', [Authenticate], RebutController.get)
    /**
     * @openapi
     * /stocks/rebuts:
     *   post:
     *     tags: [Rebuts]
     *     summary: Crée un rebut
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
     *         description: Rebut créé
     */
    .post('/', [Authenticate], RebutController.create)
    /**
     * @openapi
     * /stocks/rebuts/{id}:
     *   put:
     *     tags: [Rebuts]
     *     summary: Met à jour un rebut
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
     *         description: Rebut mis à jour
     */
    .put('/:id', [Authenticate], RebutController.update)
    /**
     * @openapi
     * /stocks/rebuts/{id}:
     *   delete:
     *     tags: [Rebuts]
     *     summary: Supprime un rebut
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
     *         description: Rebut supprimé
     */
    .delete('/:id', [Authenticate], RebutController.delete)
export default router;
