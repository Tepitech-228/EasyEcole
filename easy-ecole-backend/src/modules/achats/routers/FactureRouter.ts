import express from "express"
import FactureController from "../controllers/FactureController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/factures:
     *   get:
     *     tags: [Achats - Factures]
     *     summary: Liste toutes les factures pro forma
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des factures
     */
    .get('/', FactureController.getAll)
    /**
     * @openapi
     * /achats/factures:
     *   post:
     *     tags: [Achats - Factures]
     *     summary: Crée une facture pro forma
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
     *               montantTotal:
     *                 type: number
     *               lignesFacture:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     ligneCommandeId:
     *                       type: integer
     *                     designation:
     *                       type: string
     *                     quantite:
     *                       type: integer
     *                     prixUnitaire:
     *                       type: number
     *     responses:
     *       201:
     *         description: Facture créée
     */
    .post('/', FactureController.create)
    /**
     * @openapi
     * /achats/factures/{id}:
     *   get:
     *     tags: [Achats - Factures]
     *     summary: Détails d'une facture
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails de la facture
     */
    .get('/:id', FactureController.get)
    /**
     * @openapi
     * /achats/factures/{id}:
     *   put:
     *     tags: [Achats - Factures]
     *     summary: Met à jour une facture
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Facture mise à jour
     */
    .put('/:id', FactureController.update)
    /**
     * @openapi
     * /achats/factures/{id}:
     *   delete:
     *     tags: [Achats - Factures]
     *     summary: Supprime une facture
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Facture supprimée
     */
    .delete('/:id', FactureController.delete)

export default router
