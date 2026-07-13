import express from "express"

import CommunicationController from "../controllers/CommunicationController"

const router = express.Router()

router
    /**
     * @openapi
     * /communication/communications:
     *   get:
     *     tags: [Communications]
     *     summary: Liste toutes les communications
     *     responses:
     *       200:
     *         description: Liste des communications
     */
    .get('/', CommunicationController.getAllCommunications)
    /**
     * @openapi
     * /communication/communications:
     *   post:
     *     tags: [Communications]
     *     summary: Crée une nouvelle communication
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               titre:
     *                 type: string
     *               contenu:
     *                 type: string
     *               statut:
     *                 type: string
     *     responses:
     *       201:
     *         description: Communication créée
     */
    .post('/', CommunicationController.createCommunication)
    /**
     * @openapi
     * /communication/communications/{id}:
     *   get:
     *     tags: [Communications]
     *     summary: Récupère une communication par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la communication
     */
    .get('/:id', CommunicationController.getCommunication)
    /**
     * @openapi
     * /communication/communications/{id}:
     *   put:
     *     tags: [Communications]
     *     summary: Met à jour une communication
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
     *               titre:
     *                 type: string
     *               contenu:
     *                 type: string
     *               statut:
     *                 type: string
     *     responses:
     *       200:
     *         description: Communication mise à jour
     */
    .put('/:id', CommunicationController.updateCommunication)
    /**
     * @openapi
     * /communication/communications/{id}:
     *   delete:
     *     tags: [Communications]
     *     summary: Supprime une communication
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Communication supprimée
     */
    .delete('/:id', CommunicationController.deleteCommunication)
    /**
     * @openapi
     * /communication/communications/statistics/count:
     *   get:
     *     tags: [Communications]
     *     summary: Retourne le nombre total de communications
     *     responses:
     *       200:
     *         description: Nombre de communications
     */
    .get('/statistics/count', CommunicationController.getCount)

export default router
