import express from "express"

import CategorieController from "../controllers/CategorieController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/categories:
     *   get:
     *     tags: [Catégories]
     *     summary: Liste toutes les catégories de parcours
     *     responses:
     *       200:
     *         description: Liste des catégories
     */
    .get('/', CategorieController.getAllCategories)
    /**
     * @openapi
     * /orientation/categories:
     *   post:
     *     tags: [Catégories]
     *     summary: Crée une nouvelle catégorie
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
    .post('/', [AuthInstitution, CheckPermission('action.orientation.categorie.creer')], CategorieController.createCategorie)
    /**
     * @openapi
     * /orientation/categories/{id}:
     *   get:
     *     tags: [Catégories]
     *     summary: Récupère une catégorie par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la catégorie
     */
    .get('/:id', CategorieController.getCategorie)
    /**
     * @openapi
     * /orientation/categories/{id}:
     *   put:
     *     tags: [Catégories]
     *     summary: Met à jour une catégorie
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
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Catégorie mise à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.orientation.categorie.modifier')], CategorieController.updateCategorie)
    /**
     * @openapi
     * /orientation/categories/{id}:
     *   delete:
     *     tags: [Catégories]
     *     summary: Supprime une catégorie
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Catégorie supprimée
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.orientation.categorie.supprimer')], CategorieController.deleteCategorie)
    /**
     * @openapi
     * /orientation/categories/statistics/count:
     *   get:
     *     tags: [Catégories]
     *     summary: Retourne le nombre total de catégories
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de catégories
     */
    .get('/statistics/count', [AuthInstitution], CategorieController.getCount)

export default router