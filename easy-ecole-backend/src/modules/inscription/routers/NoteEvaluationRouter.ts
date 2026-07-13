import express from "express"

import NoteEvaluationController from "../controllers/NoteEvaluationController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

/**
 * @openapi
 * /inscription/notesEvaluation:
 *   get:
 *     tags: [Notes]
 *     summary: Liste toutes les notes d'évaluation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notes d'évaluation
 */
router
    .get('/', [Authenticate], NoteEvaluationController.getAll)
/**
 * @openapi
 * /inscription/notesEvaluation/upsert:
 *   post:
 *     tags: [Notes]
 *     summary: Crée ou met à jour une note d'évaluation
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
 *         description: Note créée ou mise à jour
 */
    .post('/upsert', [Authenticate], NoteEvaluationController.upsert)
/**
 * @openapi
 * /inscription/notesEvaluation/bulk-upsert:
 *   post:
 *     tags: [Notes]
 *     summary: Crée ou met à jour plusieurs notes d'évaluation en masse
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
 *         description: Notes créées ou mises à jour
 */
    .post('/bulk-upsert', [Authenticate], NoteEvaluationController.bulkUpsert)
/**
 * @openapi
 * /inscription/notesEvaluation/{id}:
 *   get:
 *     tags: [Notes]
 *     summary: Récupère une note d'évaluation par son ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note
 *     responses:
 *       200:
 *         description: Détail de la note
 *       404:
 *         description: Note non trouvée
 */
    .get('/:id', [Authenticate], NoteEvaluationController.getOne)
/**
 * @openapi
 * /inscription/notesEvaluation/{id}:
 *   delete:
 *     tags: [Notes]
 *     summary: Supprime une note d'évaluation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la note
 *     responses:
 *       200:
 *         description: Note supprimée
 *       404:
 *         description: Note non trouvée
 */
    .delete('/:id', [Authenticate], NoteEvaluationController.delete)

export default router
