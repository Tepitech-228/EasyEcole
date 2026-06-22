import express from "express"
import RhParticipationFormationController from "../controllers/RhParticipationFormationController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/participations-formation:
   *   get:
   *     tags: [RH - Participations formation]
   *     summary: Liste toutes les participations aux formations
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des participations
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhParticipationFormationController.getAll)
  /**
   * @openapi
   * /rh/participations-formation/{id}:
   *   get:
   *     tags: [RH - Participations formation]
   *     summary: Récupère une participation par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la participation
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhParticipationFormationController.get)
  /**
   * @openapi
   * /rh/participations-formation:
   *   post:
   *     tags: [RH - Participations formation]
   *     summary: Crée une nouvelle participation à une formation
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               formationId:
   *                 type: string
   *               employeId:
   *                 type: string
   *               statut:
   *                 type: string
   *                 enum: [inscrit, terminé, abandon]
   *     responses:
   *       201:
   *         description: Participation créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhParticipationFormationController.create)
  /**
   * @openapi
   * /rh/participations-formation/{id}:
   *   put:
   *     tags: [RH - Participations formation]
   *     summary: Met à jour une participation
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
   *               statut:
   *                 type: string
   *                 enum: [inscrit, terminé, abandon]
   *     responses:
   *       200:
   *         description: Participation mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhParticipationFormationController.update)
  /**
   * @openapi
   * /rh/participations-formation/{id}:
   *   delete:
   *     tags: [RH - Participations formation]
   *     summary: Supprime une participation
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Participation supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhParticipationFormationController.delete)

export default router
