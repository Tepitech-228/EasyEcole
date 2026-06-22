import express from "express"
import ReceptionController from "../controllers/ReceptionController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/receptions:
     *   get:
     *     tags: [Achats - Réceptions]
     *     summary: Liste toutes les réceptions
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des réceptions
     */
    .get('/', ReceptionController.getAll)
    /**
     * @openapi
     * /achats/receptions:
     *   post:
     *     tags: [Achats - Réceptions]
     *     summary: Enregistre une réception avec liens stock/immobilisations
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               commandeId:
     *                 type: integer
     *               statut:
     *                 type: string
     *                 enum: [partielle, totale]
     *               notes:
     *                 type: string
     *               lignesReception:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     ligneCommandeId:
     *                       type: integer
     *                     quantiteRecue:
     *                       type: integer
     *                     articleId:
     *                       type: integer
     *     responses:
     *       201:
     *         description: Réception créée
     */
    .post('/', ReceptionController.create)
    /**
     * @openapi
     * /achats/receptions/{id}:
     *   get:
     *     tags: [Achats - Réceptions]
     *     summary: Détails d'une réception
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails de la réception
     */
    .get('/:id', ReceptionController.get)
    /**
     * @openapi
     * /achats/receptions/{id}:
     *   delete:
     *     tags: [Achats - Réceptions]
     *     summary: Supprime une réception
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Réception supprimée
     */
    .delete('/:id', ReceptionController.delete)

export default router
