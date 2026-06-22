import express from "express"

import ReponseOrientationController from "../controllers/ReponseOrientationController"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/reponses-orientation:
     *   get:
     *     tags: [Réponses d'orientation]
     *     summary: Liste toutes les réponses d'orientation
     *     responses:
     *       200:
     *         description: Liste des réponses d'orientation
     */
    .get('/', ReponseOrientationController.getAllReponsesOrientation)
    /**
     * @openapi
     * /orientation/reponses-orientation:
     *   post:
     *     tags: [Réponses d'orientation]
     *     summary: Crée une nouvelle réponse d'orientation
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               demandeOrientationId:
     *                 type: string
     *               contenu:
     *                 type: string
     *     responses:
     *       201:
     *         description: Réponse d'orientation créée
     */
    .post('/', [], ReponseOrientationController.createReponseOrientation)
    /**
     * @openapi
     * /orientation/reponses-orientation/{id}:
     *   get:
     *     tags: [Réponses d'orientation]
     *     summary: Récupère une réponse d'orientation par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la réponse d'orientation
     */
    .get('/:id', ReponseOrientationController.getReponseOrientation)
    // .put('/:id', [], ReponseOrientationController.updateReponseOrientation)
    /**
     * @openapi
     * /orientation/reponses-orientation/{id}/autoriser:
     *   put:
     *     tags: [Réponses d'orientation]
     *     summary: Autorise ou refuse l'inscription provisoire
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
     *               statutAutorisation:
     *                 type: string
     *     responses:
     *       200:
     *         description: Autorisation mise à jour
     */
    .put('/:id/autoriser', [], ReponseOrientationController.autoriserInscription)
    /**
     * @openapi
     * /orientation/reponses-orientation/{id}:
     *   delete:
     *     tags: [Réponses d'orientation]
     *     summary: Supprime une réponse d'orientation
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Réponse d'orientation supprimée
     */
    .delete('/:id', [], ReponseOrientationController.deleteReponseOrientation)
    /**
     * @openapi
     * /orientation/reponses-orientation/statistics/count:
     *   get:
     *     tags: [Réponses d'orientation]
     *     summary: Retourne le nombre total de réponses d'orientation
     *     responses:
     *       200:
     *         description: Nombre de réponses d'orientation
     */
    .get('/statistics/count', [], ReponseOrientationController.getCount)

export default router