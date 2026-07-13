import express from "express"
import RhFormationController from "../controllers/RhFormationController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/formations:
   *   get:
   *     tags: [RH - Formations]
   *     summary: Liste toutes les formations
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des formations
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhFormationController.getAll)
  /**
   * @openapi
   * /rh/formations/{id}:
   *   get:
   *     tags: [RH - Formations]
   *     summary: Récupère une formation par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la formation
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhFormationController.get)
  /**
   * @openapi
   * /rh/formations:
   *   post:
   *     tags: [RH - Formations]
   *     summary: Crée une nouvelle formation
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titre:
   *                 type: string
   *               description:
   *                 type: string
   *               dateDebut:
   *                 type: string
   *                 format: date
   *               dateFin:
   *                 type: string
   *                 format: date
   *               formateur:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [interne, externe]
   *     responses:
   *       201:
   *         description: Formation créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhFormationController.create)
  /**
   * @openapi
   * /rh/formations/{id}:
   *   put:
   *     tags: [RH - Formations]
   *     summary: Met à jour une formation
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
   *               titre:
   *                 type: string
   *               description:
   *                 type: string
   *               dateDebut:
   *                 type: string
   *                 format: date
   *               dateFin:
   *                 type: string
   *                 format: date
   *               formateur:
   *                 type: string
   *     responses:
   *       200:
   *         description: Formation mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhFormationController.update)
  /**
   * @openapi
   * /rh/formations/{id}:
   *   delete:
   *     tags: [RH - Formations]
   *     summary: Supprime une formation
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Formation supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhFormationController.delete)

export default router
