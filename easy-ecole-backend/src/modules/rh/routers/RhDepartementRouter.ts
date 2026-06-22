import express from "express"
import RhDepartementController from "../controllers/RhDepartementController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/departements:
   *   get:
   *     tags: [RH - Départements]
   *     summary: Liste tous les départements
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des départements
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhDepartementController.getAll)
  /**
   * @openapi
   * /rh/departements/{id}:
   *   get:
   *     tags: [RH - Départements]
   *     summary: Récupère un département par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails du département
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhDepartementController.get)
  /**
   * @openapi
   * /rh/departements:
   *   post:
   *     tags: [RH - Départements]
   *     summary: Crée un nouveau département
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
   *     responses:
   *       201:
   *         description: Département créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhDepartementController.create)
  /**
   * @openapi
   * /rh/departements/{id}:
   *   put:
   *     tags: [RH - Départements]
   *     summary: Met à jour un département
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
   *     responses:
   *       200:
   *         description: Département mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhDepartementController.update)
  /**
   * @openapi
   * /rh/departements/{id}:
   *   delete:
   *     tags: [RH - Départements]
   *     summary: Supprime un département
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Département supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhDepartementController.delete)

export default router
