import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import FournisseurController from "../controllers/FournisseurController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/fournisseurs:
     *   get:
     *     tags: [Fournisseurs]
     *     summary: Liste tous les fournisseurs
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des fournisseurs
     */
    .get('/', [Authenticate], FournisseurController.getAll)
    /**
     * @openapi
     * /stocks/fournisseurs/{id}:
     *   get:
     *     tags: [Fournisseurs]
     *     summary: Détail d'un fournisseur
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
     *         description: Détail du fournisseur
     */
    .get('/:id', [Authenticate], FournisseurController.get)
    /**
     * @openapi
     * /stocks/fournisseurs:
     *   post:
     *     tags: [Fournisseurs]
     *     summary: Crée un fournisseur
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
     *         description: Fournisseur créé
     */
    .post('/', [Authenticate], FournisseurController.create)
    /**
     * @openapi
     * /stocks/fournisseurs/{id}:
     *   put:
     *     tags: [Fournisseurs]
     *     summary: Met à jour un fournisseur
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
     *         description: Fournisseur mis à jour
     */
    .put('/:id', [Authenticate], FournisseurController.update)
    /**
     * @openapi
     * /stocks/fournisseurs/{id}:
     *   delete:
     *     tags: [Fournisseurs]
     *     summary: Supprime un fournisseur
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
     *         description: Fournisseur supprimé
     */
    .delete('/:id', [Authenticate], FournisseurController.delete)
export default router;
