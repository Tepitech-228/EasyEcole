import express from "express"
import DemandeController from "../controllers/DemandeController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/demandes:
     *   get:
     *     tags: [Achats - Demandes]
     *     summary: Liste toutes les demandes d'achat
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des demandes
     */
    .get('/', DemandeController.getAll)
    /**
     * @openapi
     * /achats/demandes:
     *   post:
     *     tags: [Achats - Demandes]
     *     summary: Crée une nouvelle demande d'achat
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               description:
     *                 type: string
     *               statut:
     *                 type: string
     *               validateurChoisiId:
     *                 type: integer
     *               lignesDemande:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     designation:
     *                       type: string
     *                     quantite:
     *                       type: integer
     *                     prixEstime:
     *                       type: number
     *                     unite:
     *                       type: string
     *     responses:
     *       201:
     *         description: Demande créée
     */
    .post('/', DemandeController.create)
    /**
     * @openapi
     * /achats/demandes/mes-demandes:
     *   get:
     *     tags: [Achats - Demandes]
     *     summary: Liste mes demandes d'achat
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste de mes demandes
     */
    .get('/mes-demandes', DemandeController.getMesDemandes)
    /**
     * @openapi
     * /achats/demandes/{id}:
     *   get:
     *     tags: [Achats - Demandes]
     *     summary: Détails d'une demande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails de la demande
     */
    .get('/:id', DemandeController.get)
    /**
     * @openapi
     * /achats/demandes/{id}:
     *   put:
     *     tags: [Achats - Demandes]
     *     summary: Met à jour une demande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Demande mise à jour
     */
    .put('/:id', DemandeController.update)
    /**
     * @openapi
     * /achats/demandes/{id}:
     *   delete:
     *     tags: [Achats - Demandes]
     *     summary: Supprime une demande
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Demande supprimée
     */
    .delete('/:id', DemandeController.delete)

export default router
