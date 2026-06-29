import express from "express"

import TypeNoteEvaluationController from "../controllers/TypeNoteEvaluationController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /inscription/typesNoteEvaluation:
 *   get:
 *     tags: [Types d'évaluation]
 *     summary: Liste tous les types d'évaluation
 *     responses:
 *       200:
 *         description: Liste des types d'évaluation
 */
router
    .get('/', TypeNoteEvaluationController.getAllTypesNoteEvaluation)
/**
 * @openapi
 * /inscription/typesNoteEvaluation:
 *   post:
 *     tags: [Types d'évaluation]
 *     summary: Crée un nouveau type d'évaluation
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
 *         description: Type d'évaluation créé
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.type-note.creer')], TypeNoteEvaluationController.createTypeNoteEvaluation)
/**
 * @openapi
 * /inscription/typesNoteEvaluation/{id}:
 *   get:
 *     tags: [Types d'évaluation]
 *     summary: Récupère un type d'évaluation par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du type d'évaluation
 *     responses:
 *       200:
 *         description: Détail du type d'évaluation
 *       404:
 *         description: Type d'évaluation non trouvé
 */
    .get('/:id', TypeNoteEvaluationController.getTypeNoteEvaluation)
/**
 * @openapi
 * /inscription/typesNoteEvaluation/{id}:
 *   put:
 *     tags: [Types d'évaluation]
 *     summary: Met à jour un type d'évaluation
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
 *         description: Type d'évaluation mis à jour
 *       404:
 *         description: Type d'évaluation non trouvé
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.type-note.modifier')], TypeNoteEvaluationController.updateTypeNoteEvaluation)
/**
 * @openapi
 * /inscription/typesNoteEvaluation/{id}:
 *   delete:
 *     tags: [Types d'évaluation]
 *     summary: Supprime un type d'évaluation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Type d'évaluation supprimé
 *       404:
 *         description: Type d'évaluation non trouvé
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.type-note.supprimer')], TypeNoteEvaluationController.deleteTypeNoteEvaluation)
/**
 * @openapi
 * /inscription/typesNoteEvaluation/statistics/count:
 *   get:
 *     tags: [Types d'évaluation]
 *     summary: Retourne le nombre total de types d'évaluation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de types d'évaluation
 */
    .get('/statistics/count', [AuthInstitution], TypeNoteEvaluationController.getCount)

export default router