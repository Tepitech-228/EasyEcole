import express from "express"
import RhEvaluationCritereController from "../controllers/RhEvaluationCritereController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/evaluations-criteres:
   *   get:
   *     tags: [RH - Évaluations par critère]
   *     summary: Liste toutes les évaluations par critère
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des évaluations
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhEvaluationCritereController.getAll)
  /**
   * @openapi
   * /rh/evaluations-criteres/{id}:
   *   get:
   *     tags: [RH - Évaluations par critère]
   *     summary: Récupère une évaluation critère par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de l'évaluation
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhEvaluationCritereController.get)
  /**
   * @openapi
   * /rh/evaluations-criteres:
   *   post:
   *     tags: [RH - Évaluations par critère]
   *     summary: Crée une nouvelle évaluation critère
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ficheId:
   *                 type: string
   *               critereId:
   *                 type: string
   *               note:
   *                 type: number
   *     responses:
   *       201:
   *         description: Évaluation créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhEvaluationCritereController.create)
  /**
   * @openapi
   * /rh/evaluations-criteres/{id}:
   *   put:
   *     tags: [RH - Évaluations par critère]
   *     summary: Met à jour une évaluation critère
   *     security: [{ bearerAuth: [] }]
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
   *               note:
   *                 type: number
   *     responses:
   *       200:
   *         description: Évaluation mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhEvaluationCritereController.update)
  /**
   * @openapi
   * /rh/evaluations-criteres/{id}:
   *   delete:
   *     tags: [RH - Évaluations par critère]
   *     summary: Supprime une évaluation critère
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Évaluation supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhEvaluationCritereController.delete)

export default router
