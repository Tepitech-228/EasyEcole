import express from "express"

import ReclamationController from "../controllers/ReclamationController"

const router = express.Router()

router
    /**
     * @openapi
     * /scolarite/reclamations:
     *   get:
     *     tags: [Réclamations]
     *     summary: Liste toutes les réclamations
     *     responses:
     *       200:
     *         description: Liste des réclamations
     */
    .get('/', ReclamationController.getAllReclamations)
    /**
     * @openapi
     * /scolarite/reclamations:
     *   post:
     *     tags: [Réclamations]
     *     summary: Crée une nouvelle réclamation
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               motif:
     *                 type: string
     *               evaluationId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Réclamation créée
     */
    .post('/', ReclamationController.createReclamation)
    /**
     * @openapi
     * /scolarite/reclamations/repondre:
     *   post:
     *     tags: [Réclamations]
     *     summary: Répondre à une réclamation
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               reclamationId:
     *                 type: string
     *               reponse:
     *                 type: string
     *     responses:
     *       201:
     *         description: Réponse enregistrée
     */
    .post('/repondre', ReclamationController.repondreReclamation)
    /**
     * @openapi
     * /scolarite/reclamations/{id}:
     *   get:
     *     tags: [Réclamations]
     *     summary: Récupère une réclamation par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la réclamation
     */
    .get('/:id', ReclamationController.getReclamation)
    /**
     * @openapi
     * /scolarite/reclamations/{id}:
     *   put:
     *     tags: [Réclamations]
     *     summary: Met à jour le statut d'une réclamation
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Réclamation mise à jour
     */
    .put('/:id', ReclamationController.updateReclamationStatut)
    /**
     * @openapi
     * /scolarite/reclamations/{id}:
     *   delete:
     *     tags: [Réclamations]
     *     summary: Supprime une réclamation
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Réclamation supprimée
     */
    .delete('/:id', ReclamationController.deleteReclamation)
    /**
     * @openapi
     * /scolarite/reclamations/statistics/count:
     *   get:
     *     tags: [Réclamations]
     *     summary: Retourne le nombre total de réclamations
     *     responses:
     *       200:
     *         description: Nombre de réclamations
     */
    .get('/statistics/count', ReclamationController.getCount)

export default router
