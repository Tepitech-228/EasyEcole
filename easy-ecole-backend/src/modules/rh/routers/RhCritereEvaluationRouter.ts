import express from "express"
import RhCritereEvaluationController from "../controllers/RhCritereEvaluationController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/criteres-evaluation:
   *   get:
   *     tags: [RH - Critères d'évaluation]
   *     summary: Liste tous les critères d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des critères
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhCritereEvaluationController.getAll)
  /**
   * @openapi
   * /rh/criteres-evaluation/{id}:
   *   get:
   *     tags: [RH - Critères d'évaluation]
   *     summary: Récupère un critère par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails du critère
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhCritereEvaluationController.get)
  /**
   * @openapi
   * /rh/criteres-evaluation:
   *   post:
   *     tags: [RH - Critères d'évaluation]
   *     summary: Crée un nouveau critère d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nom:
   *                 type: string
   *               description:
   *                 type: string
   *               poids:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Critère créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhCritereEvaluationController.create)
  /**
   * @openapi
   * /rh/criteres-evaluation/{id}:
   *   put:
   *     tags: [RH - Critères d'évaluation]
   *     summary: Met à jour un critère d'évaluation
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
   *               nom:
   *                 type: string
   *               description:
   *                 type: string
   *               poids:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Critère mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhCritereEvaluationController.update)
  /**
   * @openapi
   * /rh/criteres-evaluation/{id}:
   *   delete:
   *     tags: [RH - Critères d'évaluation]
   *     summary: Supprime un critère d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Critère supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhCritereEvaluationController.delete)

export default router
