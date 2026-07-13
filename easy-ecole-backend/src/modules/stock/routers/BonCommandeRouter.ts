import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import BonCommandeController from "../controllers/BonCommandeController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/commandes:
     *   get:
     *     tags: [Bons de commande]
     *     summary: Liste tous les bons de commande
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des bons de commande
     */
    .get('/', [Authenticate], BonCommandeController.getAll)
    /**
     * @openapi
     * /stocks/commandes/{id}:
     *   get:
     *     tags: [Bons de commande]
     *     summary: Détail d'un bon de commande
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
     *         description: Détail du bon de commande
     */
    .get('/:id', [Authenticate], BonCommandeController.get)
    /**
     * @openapi
     * /stocks/commandes:
     *   post:
     *     tags: [Bons de commande]
     *     summary: Crée un bon de commande
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
     *         description: Bon de commande créé
     */
    .post('/', [Authenticate], BonCommandeController.create)
    /**
     * @openapi
     * /stocks/commandes/{id}:
     *   put:
     *     tags: [Bons de commande]
     *     summary: Met à jour un bon de commande
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
     *         description: Bon de commande mis à jour
     */
    .put('/:id', [Authenticate], BonCommandeController.update)
    /**
     * @openapi
     * /stocks/commandes/{id}:
     *   delete:
     *     tags: [Bons de commande]
     *     summary: Supprime un bon de commande
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
     *         description: Bon de commande supprimé
     */
    .delete('/:id', [Authenticate], BonCommandeController.delete)
export default router;
