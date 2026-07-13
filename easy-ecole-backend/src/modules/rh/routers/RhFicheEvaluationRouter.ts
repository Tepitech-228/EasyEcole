import express from "express"
import RhFicheEvaluationController from "../controllers/RhFicheEvaluationController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/fiches-evaluation:
   *   get:
   *     tags: [RH - Fiches d'évaluation]
   *     summary: Liste toutes les fiches d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des fiches d'évaluation
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhFicheEvaluationController.getAll)
  /**
   * @openapi
   * /rh/fiches-evaluation/{id}:
   *   get:
   *     tags: [RH - Fiches d'évaluation]
   *     summary: Récupère une fiche d'évaluation par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la fiche d'évaluation
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhFicheEvaluationController.get)
  /**
   * @openapi
   * /rh/fiches-evaluation:
   *   post:
   *     tags: [RH - Fiches d'évaluation]
   *     summary: Crée une nouvelle fiche d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               employeId:
   *                 type: string
   *               evaluateurId:
   *                 type: string
   *               dateEvaluation:
   *                 type: string
   *                 format: date
   *               noteGlobale:
   *                 type: number
   *               commentaire:
   *                 type: string
   *     responses:
   *       201:
   *         description: Fiche d'évaluation créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhFicheEvaluationController.create)
  /**
   * @openapi
   * /rh/fiches-evaluation/{id}:
   *   put:
   *     tags: [RH - Fiches d'évaluation]
   *     summary: Met à jour une fiche d'évaluation
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
   *               noteGlobale:
   *                 type: number
   *               commentaire:
   *                 type: string
   *     responses:
   *       200:
   *         description: Fiche d'évaluation mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhFicheEvaluationController.update)
  /**
   * @openapi
   * /rh/fiches-evaluation/{id}:
   *   delete:
   *     tags: [RH - Fiches d'évaluation]
   *     summary: Supprime une fiche d'évaluation
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Fiche d'évaluation supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhFicheEvaluationController.delete)

export default router
