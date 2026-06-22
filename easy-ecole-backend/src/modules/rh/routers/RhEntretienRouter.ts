import express from "express"
import RhEntretienController from "../controllers/RhEntretienController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/entretiens:
   *   get:
   *     tags: [RH - Entretiens]
   *     summary: Liste tous les entretiens
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des entretiens
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhEntretienController.getAll)
  /**
   * @openapi
   * /rh/entretiens/{id}:
   *   get:
   *     tags: [RH - Entretiens]
   *     summary: Récupère un entretien par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de l'entretien
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhEntretienController.get)
  /**
   * @openapi
   * /rh/entretiens:
   *   post:
   *     tags: [RH - Entretiens]
   *     summary: Crée un nouvel entretien
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               candidatureId:
   *                 type: string
   *               date:
   *                 type: string
   *                 format: date
   *               heure:
   *                 type: string
   *               lieu:
   *                 type: string
   *               commentaire:
   *                 type: string
   *     responses:
   *       201:
   *         description: Entretien créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhEntretienController.create)
  /**
   * @openapi
   * /rh/entretiens/{id}:
   *   put:
   *     tags: [RH - Entretiens]
   *     summary: Met à jour un entretien
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
   *               date:
   *                 type: string
   *                 format: date
   *               heure:
   *                 type: string
   *               lieu:
   *                 type: string
   *               statut:
   *                 type: string
   *     responses:
   *       200:
   *         description: Entretien mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhEntretienController.update)
  /**
   * @openapi
   * /rh/entretiens/{id}:
   *   delete:
   *     tags: [RH - Entretiens]
   *     summary: Supprime un entretien
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Entretien supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhEntretienController.delete)

export default router
