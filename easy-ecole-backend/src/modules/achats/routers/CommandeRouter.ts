import express from "express"
import CommandeController from "../controllers/CommandeController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/commandes:
     *   get:
     *     tags: [Achats - Commandes]
     *     summary: Liste toutes les commandes
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des commandes
     */
    .get('/', CommandeController.getAll)
    /**
     * @openapi
     * /achats/commandes:
     *   post:
     *     tags: [Achats - Commandes]
     *     summary: Crée une nouvelle commande
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               demandeId:
     *                 type: integer
     *               fournisseurId:
     *                 type: integer
     *               lignesCommande:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     designation:
     *                       type: string
     *                     quantite:
     *                       type: integer
     *                     prixUnitaire:
     *                       type: number
     *                     gereEnStock:
     *                       type: boolean
     *                     actifImmobilise:
     *                       type: boolean
     *     responses:
     *       201:
     *         description: Commande créée
     */
    .post('/', CommandeController.create)
    /**
     * @openapi
     * /achats/commandes/{id}:
     *   get:
     *     tags: [Achats - Commandes]
     *     summary: Détails d'une commande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails de la commande
     */
    .get('/:id', CommandeController.get)
    /**
     * @openapi
     * /achats/commandes/{id}:
     *   put:
     *     tags: [Achats - Commandes]
     *     summary: Met à jour une commande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Commande mise à jour
     */
    .put('/:id', CommandeController.update)
    /**
     * @openapi
     * /achats/commandes/{id}:
     *   delete:
     *     tags: [Achats - Commandes]
     *     summary: Supprime une commande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Commande supprimée
     */
    .delete('/:id', CommandeController.delete)

export default router
