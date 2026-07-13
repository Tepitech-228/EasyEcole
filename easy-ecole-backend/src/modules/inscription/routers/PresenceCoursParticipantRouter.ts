import express from "express"

import PresenceCoursParticipantController from "../controllers/PresenceCoursParticipantController"

const router = express.Router()

/**
 * @openapi
 * /inscription/presencesCoursParticipants:
 *   get:
 *     tags: [Présences]
 *     summary: Liste toutes les présences par cours participant
 *     responses:
 *       200:
 *         description: Liste des présences
 */
router
    .get('/', PresenceCoursParticipantController.getAllPresencesCoursParticipants)
/**
 * @openapi
 * /inscription/presencesCoursParticipants:
 *   post:
 *     tags: [Présences]
 *     summary: Crée une nouvelle présence cours participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Présence créée
 */
    .post('/', [], PresenceCoursParticipantController.createPresenceCoursParticipant)
/**
 * @openapi
 * /inscription/presencesCoursParticipants/{id}:
 *   get:
 *     tags: [Présences]
 *     summary: Récupère une présence cours participant par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la présence
 *     responses:
 *       200:
 *         description: Détail de la présence
 *       404:
 *         description: Présence non trouvée
 */
    .get('/:id', PresenceCoursParticipantController.getPresenceCoursParticipant)
/**
 * @openapi
 * /inscription/presencesCoursParticipants/{id}:
 *   put:
 *     tags: [Présences]
 *     summary: Met à jour une présence cours participant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Présence mise à jour
 *       404:
 *         description: Présence non trouvée
 */
    .put('/:id', [], PresenceCoursParticipantController.updatePresenceCoursParticipant)
/**
 * @openapi
 * /inscription/presencesCoursParticipants/{id}:
 *   delete:
 *     tags: [Présences]
 *     summary: Supprime une présence cours participant
 *     responses:
 *       200:
 *         description: Présence supprimée
 *       404:
 *         description: Présence non trouvée
 */
    .delete('/:id', [], PresenceCoursParticipantController.deletePresenceCoursParticipant)
/**
 * @openapi
 * /inscription/presencesCoursParticipants/statistics/count:
 *   get:
 *     tags: [Présences]
 *     summary: Retourne le nombre total de présences cours participant
 *     responses:
 *       200:
 *         description: Nombre de présences
 */
    .get('/statistics/count', [], PresenceCoursParticipantController.getCount)

export default router