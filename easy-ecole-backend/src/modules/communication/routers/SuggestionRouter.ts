import express from "express"

import SuggestionController from "../controllers/SuggestionController"

const router = express.Router()

router
    /**
     * @openapi
     * /communication/suggestions:
     *   get:
     *     tags: [Suggestions]
     *     summary: Liste toutes les suggestions
     *     responses:
     *       200:
     *         description: Liste des suggestions
     */
    .get('/', SuggestionController.getAllSuggestions)
    /**
     * @openapi
     * /communication/suggestions:
     *   post:
     *     tags: [Suggestions]
     *     summary: Crée une nouvelle suggestion
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               message:
     *                 type: string
     *               type:
     *                 type: string
     *     responses:
     *       201:
     *         description: Suggestion créée
     */
    .post('/', SuggestionController.createSuggestion)
    /**
     * @openapi
     * /communication/suggestions/repondre:
     *   post:
     *     tags: [Suggestions]
     *     summary: Répondre à une suggestion
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               suggestionId:
     *                 type: string
     *               message:
     *                 type: string
     *     responses:
     *       201:
     *         description: Réponse enregistrée
     */
    .post('/repondre', SuggestionController.repondreSuggestion)
    /**
     * @openapi
     * /communication/suggestions/{id}:
     *   get:
     *     tags: [Suggestions]
     *     summary: Récupère une suggestion par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la suggestion
     */
    .get('/:id', SuggestionController.getSuggestion)
    /**
     * @openapi
     * /communication/suggestions/{id}:
     *   put:
     *     tags: [Suggestions]
     *     summary: Met à jour le statut d'une suggestion
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
     *         description: Suggestion mise à jour
     */
    .put('/:id', SuggestionController.updateSuggestionStatut)
    /**
     * @openapi
     * /communication/suggestions/{id}:
     *   delete:
     *     tags: [Suggestions]
     *     summary: Supprime une suggestion
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Suggestion supprimée
     */
    .delete('/:id', SuggestionController.deleteSuggestion)
    /**
     * @openapi
     * /communication/suggestions/statistics/count:
     *   get:
     *     tags: [Suggestions]
     *     summary: Retourne le nombre total de suggestions
     *     responses:
     *       200:
     *         description: Nombre de suggestions
     */
    .get('/statistics/count', SuggestionController.getCount)

export default router
