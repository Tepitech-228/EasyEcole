import express from "express"

import SessionController from "../controllers/SessionController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

/**
 * @openapi
 * /inscription/sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: Liste toutes les sessions académiques
 *     responses:
 *       200:
 *         description: Liste des sessions
 */
router
    .get('/', SessionController.getAllSessions)
/**
 * @openapi
 * /inscription/sessions:
 *   post:
 *     tags: [Sessions]
 *     summary: Crée une nouvelle session académique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Session créée
 */
    .post('/', [AuthInstitution], SessionController.createSession)
/**
 * @openapi
 * /inscription/sessions/{id}:
 *   get:
 *     tags: [Sessions]
 *     summary: Récupère une session par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Détail de la session
 *       404:
 *         description: Session non trouvée
 */
    .get('/:id', SessionController.getSession)
/**
 * @openapi
 * /inscription/sessions/{id}:
 *   put:
 *     tags: [Sessions]
 *     summary: Met à jour une session académique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Session mise à jour
 *       404:
 *         description: Session non trouvée
 */
    .put('/:id', [AuthInstitution], SessionController.updateSession)
/**
 * @openapi
 * /inscription/sessions/{id}:
 *   delete:
 *     tags: [Sessions]
 *     summary: Supprime une session académique
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session supprimée
 *       404:
 *         description: Session non trouvée
 */
    .delete('/:id', [AuthInstitution], SessionController.deleteSession)
/**
 * @openapi
 * /inscription/sessions/statistics/count:
 *   get:
 *     tags: [Sessions]
 *     summary: Retourne le nombre total de sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de sessions
 */
    .get('/statistics/count', [AuthInstitution], SessionController.getCount)

export default router