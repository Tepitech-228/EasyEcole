import express from "express"

import DemandeDocumentController from "../controllers/DemandeDocumentController"

const router = express.Router()

router
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Liste toutes les demandes de documents
     *     responses:
     *       200:
     *         description: Liste des demandes
     */
    .get('/', DemandeDocumentController.getAllDemandesDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   post:
     *     tags: [Demandes de documents]
     *     summary: Crée une nouvelle demande de document
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               typeDocumentId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Demande créée
     */
    .post('/', DemandeDocumentController.createDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Récupère une demande par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la demande
     */
    .get('/:id', DemandeDocumentController.getDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   put:
     *     tags: [Demandes de documents]
     *     summary: Traite une demande (valider/rejeter/délivrer)
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
     *               statut:
     *                 type: string
     *     responses:
     *       200:
     *         description: Demande mise à jour
     */
    .put('/:id', DemandeDocumentController.traiterDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   delete:
     *     tags: [Demandes de documents]
     *     summary: Supprime une demande
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Demande supprimée
     */
    .delete('/:id', DemandeDocumentController.deleteDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/statistics/count:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Retourne le nombre total de demandes
     *     responses:
     *       200:
     *         description: Nombre de demandes
     */
    .get('/statistics/count', DemandeDocumentController.getCount)

export default router
