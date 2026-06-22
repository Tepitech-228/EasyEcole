import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CategorieImmobilisationController from "../controllers/CategorieImmobilisationController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/categories:
     *   get:
     *     tags: [Catégories d'immobilisations]
     *     summary: Liste toutes les catégories d'immobilisations
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des catégories d'immobilisations
     */
    .get('/', [Authenticate], CategorieImmobilisationController.getAll)
    /**
     * @openapi
     * /immobilisations/categories/{id}:
     *   get:
     *     tags: [Catégories d'immobilisations]
     *     summary: Détail d'une catégorie d'immobilisation
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
     *         description: Détail de la catégorie d'immobilisation
     */
    .get('/:id', [Authenticate], CategorieImmobilisationController.get)
    /**
     * @openapi
     * /immobilisations/categories:
     *   post:
     *     tags: [Catégories d'immobilisations]
     *     summary: Crée une catégorie d'immobilisation
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
     *         description: Catégorie d'immobilisation créée
     */
    .post('/', [Authenticate], CategorieImmobilisationController.create)
    /**
     * @openapi
     * /immobilisations/categories/{id}:
     *   put:
     *     tags: [Catégories d'immobilisations]
     *     summary: Met à jour une catégorie d'immobilisation
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
     *         description: Catégorie d'immobilisation mise à jour
     */
    .put('/:id', [Authenticate], CategorieImmobilisationController.update)
    /**
     * @openapi
     * /immobilisations/categories/{id}:
     *   delete:
     *     tags: [Catégories d'immobilisations]
     *     summary: Supprime une catégorie d'immobilisation
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
     *         description: Catégorie d'immobilisation supprimée
     */
    .delete('/:id', [Authenticate], CategorieImmobilisationController.delete)
export default router;
