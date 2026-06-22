import express from "express"
import FournisseurController from "../controllers/FournisseurController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/fournisseurs:
     *   get:
     *     tags: [Achats - Fournisseurs]
     *     summary: Liste tous les fournisseurs
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des fournisseurs
     */
    .get('/', FournisseurController.getAll)
    /**
     * @openapi
     * /achats/fournisseurs:
     *   post:
     *     tags: [Achats - Fournisseurs]
     *     summary: Crée un fournisseur
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
     *               contact:
     *                 type: string
     *               email:
     *                 type: string
     *               telephone:
     *                 type: string
     *               adresse:
     *                 type: string
     *     responses:
     *       201:
     *         description: Fournisseur créé
     */
    .post('/', FournisseurController.create)
    /**
     * @openapi
     * /achats/fournisseurs/{id}:
     *   get:
     *     tags: [Achats - Fournisseurs]
     *     summary: Détails d'un fournisseur
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails du fournisseur
     */
    .get('/:id', FournisseurController.get)
    /**
     * @openapi
     * /achats/fournisseurs/{id}:
     *   put:
     *     tags: [Achats - Fournisseurs]
     *     summary: Met à jour un fournisseur
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Fournisseur mis à jour
     */
    .put('/:id', FournisseurController.update)
    /**
     * @openapi
     * /achats/fournisseurs/{id}:
     *   delete:
     *     tags: [Achats - Fournisseurs]
     *     summary: Supprime un fournisseur
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Fournisseur supprimé
     */
    .delete('/:id', FournisseurController.delete)

export default router
