import express from "express"
import RhPosteController from "../controllers/RhPosteController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/postes:
   *   get:
   *     tags: [RH - Postes]
   *     summary: Liste tous les postes
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des postes
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhPosteController.getAll)
  /**
   * @openapi
   * /rh/postes/{id}:
   *   get:
   *     tags: [RH - Postes]
   *     summary: Récupère un poste par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails du poste
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhPosteController.get)
  /**
   * @openapi
   * /rh/postes:
   *   post:
   *     tags: [RH - Postes]
   *     summary: Crée un nouveau poste
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
   *               departementId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Poste créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhPosteController.create)
  /**
   * @openapi
   * /rh/postes/{id}:
   *   put:
   *     tags: [RH - Postes]
   *     summary: Met à jour un poste
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
   *               departementId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Poste mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhPosteController.update)
  /**
   * @openapi
   * /rh/postes/{id}:
   *   delete:
   *     tags: [RH - Postes]
   *     summary: Supprime un poste
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Poste supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhPosteController.delete)

export default router
