import express from "express"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import PresenceController from "../controllers/PresenceController"

const router = express.Router()

/**
 * @openapi
 * /inscription/presences:
 *   get:
 *     tags: [Présences]
 *     summary: Liste toutes les présences
 *     responses:
 *       200:
 *         description: Liste des présences
 */
router
    .get('/', PresenceController.getAllPresences)
/**
 * @openapi
 * /inscription/presences:
 *   post:
 *     tags: [Présences]
 *     summary: Crée une nouvelle présence
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
    .post('/', [], PresenceController.createPresence)
/**
 * @openapi
 * /inscription/presences/scan:
 *   post:
 *     tags: [Présences]
 *     summary: Enregistre une présence par scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Présence scannée
 */
    .post('/scan', [], PresenceController.scanPresence)
/**
 * @openapi
 * /inscription/presences/{id}:
 *   get:
 *     tags: [Présences]
 *     summary: Récupère une présence par son ID
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
    .get('/:id', PresenceController.getPresence)
/**
 * @openapi
 * /inscription/presences/{id}:
 *   put:
 *     tags: [Présences]
 *     summary: Met à jour une présence
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
    .put('/:id', [], PresenceController.updatePresence)
/**
 * @openapi
 * /inscription/presences/{id}:
 *   delete:
 *     tags: [Présences]
 *     summary: Supprime une présence
 *     responses:
 *       200:
 *         description: Présence supprimée
 *       404:
 *         description: Présence non trouvée
 */
    .delete('/:id', [], PresenceController.deletePresence)
/**
 * @openapi
 * /inscription/presences/{id}/sign:
 *   put:
 *     tags: [Présences]
 *     summary: Signe une présence (enseignant)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la présence
 *     responses:
 *       200:
 *         description: Présence signée
 *       404:
 *         description: Présence non trouvée
 */
    .put('/:id/sign', [AuthEnseignant], PresenceController.signPresence)
/**
 * @openapi
 * /inscription/presences/statistics/count:
 *   get:
 *     tags: [Présences]
 *     summary: Retourne le nombre total de présences
 *     responses:
 *       200:
 *         description: Nombre de présences
 */
    .get('/statistics/count', [], PresenceController.getCount)

export default router