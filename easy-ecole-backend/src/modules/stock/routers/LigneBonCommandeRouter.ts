import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LigneBonCommandeController from "../controllers/LigneBonCommandeController";

const router = express.Router();
router
    /**
     * @openapi
     * /stocks/lignes-commande:
     *   get:
     *     tags: [Lignes de bon de commande]
     *     summary: Liste toutes les lignes de bon de commande
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des lignes de bon de commande
     */
    .get('/', [Authenticate], LigneBonCommandeController.getAll)
    /**
     * @openapi
     * /stocks/lignes-commande/{id}:
     *   get:
     *     tags: [Lignes de bon de commande]
     *     summary: Détail d'une ligne de bon de commande
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
     *         description: Détail de la ligne de bon de commande
     */
    .get('/:id', [Authenticate], LigneBonCommandeController.get)
    /**
     * @openapi
     * /stocks/lignes-commande:
     *   post:
     *     tags: [Lignes de bon de commande]
     *     summary: Crée une ligne de bon de commande
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
     *         description: Ligne de bon de commande créée
     */
    .post('/', [Authenticate], LigneBonCommandeController.create)
    /**
     * @openapi
     * /stocks/lignes-commande/{id}:
     *   put:
     *     tags: [Lignes de bon de commande]
     *     summary: Met à jour une ligne de bon de commande
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
     *         description: Ligne de bon de commande mise à jour
     */
    .put('/:id', [Authenticate], LigneBonCommandeController.update)
    /**
     * @openapi
     * /stocks/lignes-commande/{id}:
     *   delete:
     *     tags: [Lignes de bon de commande]
     *     summary: Supprime une ligne de bon de commande
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
     *         description: Ligne de bon de commande supprimée
     */
    .delete('/:id', [Authenticate], LigneBonCommandeController.delete)
export default router;
