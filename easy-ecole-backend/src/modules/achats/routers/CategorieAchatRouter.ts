import express from "express"
import CategorieAchatController from "../controllers/CategorieAchatController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/categories:
     *   get:
     *     tags: [Achats - Catégories]
     *     summary: Liste toutes les catégories d'achat
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des catégories
     */
    .get('/', CategorieAchatController.getAll)
    /**
     * @openapi
     * /achats/categories:
     *   post:
     *     tags: [Achats - Catégories]
     *     summary: Crée une catégorie d'achat
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
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Catégorie créée
     */
    .post('/', CategorieAchatController.create)
    /**
     * @openapi
     * /achats/categories/{id}:
     *   put:
     *     tags: [Achats - Catégories]
     *     summary: Met à jour une catégorie
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Catégorie mise à jour
     */
    .put('/:id', CategorieAchatController.update)
    /**
     * @openapi
     * /achats/categories/{id}:
     *   delete:
     *     tags: [Achats - Catégories]
     *     summary: Supprime une catégorie
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Catégorie supprimée
     */
    .delete('/:id', CategorieAchatController.delete)

export default router
