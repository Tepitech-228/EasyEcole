import express from "express"
import multer from "multer"
import RhCandidatureController from "../controllers/RhCandidatureController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
const upload = multer({ dest: "public/rh/candidatures/" })

router
  /**
   * @openapi
   * /rh/candidatures:
   *   get:
   *     tags: [RH - Candidatures]
   *     summary: Liste toutes les candidatures
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des candidatures
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhCandidatureController.getAll)
  /**
   * @openapi
   * /rh/candidatures/{id}:
   *   get:
   *     tags: [RH - Candidatures]
   *     summary: Récupère une candidature par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la candidature
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhCandidatureController.get)
  /**
   * @openapi
   * /rh/candidatures:
   *   post:
   *     tags: [RH - Candidatures]
   *     summary: Crée une nouvelle candidature avec CV et lettre de motivation
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               offreId:
   *                 type: string
   *               nom:
   *                 type: string
   *               email:
   *                 type: string
   *               telephone:
   *                 type: string
   *               cv:
   *                 type: string
   *                 format: binary
   *               lettreMotivation:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Candidature créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines, upload.fields([{name: 'cv', maxCount: 1}, {name: 'lettreMotivation', maxCount: 1}])], RhCandidatureController.create)
  /**
   * @openapi
   * /rh/candidatures/{id}:
   *   put:
   *     tags: [RH - Candidatures]
   *     summary: Met à jour une candidature
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
   *               email:
   *                 type: string
   *               statut:
   *                 type: string
   *     responses:
   *       200:
   *         description: Candidature mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhCandidatureController.update)
  /**
   * @openapi
   * /rh/candidatures/{id}:
   *   delete:
   *     tags: [RH - Candidatures]
   *     summary: Supprime une candidature
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Candidature supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhCandidatureController.delete)

export default router
