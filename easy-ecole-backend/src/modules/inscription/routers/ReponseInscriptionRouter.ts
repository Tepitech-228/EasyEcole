import express from "express"

import ReponseInscriptionController from "../controllers/ReponseInscriptionController"

const router = express.Router()

/**
 * @openapi
 * /inscription/reponsesInscription:
 *   get:
 *     tags: [Inscription]
 *     summary: Liste toutes les réponses d'inscription
 *     responses:
 *       200:
 *         description: Liste des réponses
 */
router
    .get('/', ReponseInscriptionController.getAllReponsesInscription)
/**
 * @openapi
 * /inscription/reponsesInscription:
 *   post:
 *     tags: [Inscription]
 *     summary: Crée une nouvelle réponse d'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Réponse créée
 */
    .post('/', [], ReponseInscriptionController.createReponseInscription)
/**
 * @openapi
 * /inscription/reponsesInscription/{id}:
 *   get:
 *     tags: [Inscription]
 *     summary: Récupère une réponse d'inscription par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la réponse
 *     responses:
 *       200:
 *         description: Détail de la réponse
 *       404:
 *         description: Réponse non trouvée
 */
    .get('/:id', ReponseInscriptionController.getReponseInscription)
    // .put('/:id', [], ReponseInscriptionController.updateReponseInscription)
/**
 * @openapi
 * /inscription/reponsesInscription/{id}:
 *   delete:
 *     tags: [Inscription]
 *     summary: Supprime une réponse d'inscription
 *     responses:
 *       200:
 *         description: Réponse supprimée
 *       404:
 *         description: Réponse non trouvée
 */
    .delete('/:id', [], ReponseInscriptionController.deleteReponseInscription)
/**
 * @openapi
 * /inscription/reponsesInscription/statistics/count:
 *   get:
 *     tags: [Inscription]
 *     summary: Retourne le nombre total de réponses d'inscription
 *     responses:
 *       200:
 *         description: Nombre de réponses
 */
    .get('/statistics/count', [], ReponseInscriptionController.getCount)

export default router