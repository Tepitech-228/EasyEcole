import express from "express"
import RhTypeContratController from "../controllers/RhTypeContratController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/types-contrat:
   *   get:
   *     tags: [RH - Types de contrat]
   *     summary: Liste tous les types de contrat
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des types de contrat
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhTypeContratController.getAll)
  /**
   * @openapi
   * /rh/types-contrat/{id}:
   *   get:
   *     tags: [RH - Types de contrat]
   *     summary: Récupère un type de contrat par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails du type de contrat
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhTypeContratController.get)
  /**
   * @openapi
   * /rh/types-contrat:
   *   post:
   *     tags: [RH - Types de contrat]
   *     summary: Crée un nouveau type de contrat
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *               libelle:
   *                 type: string
   *     responses:
   *       201:
   *         description: Type de contrat créé
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhTypeContratController.create)
  /**
   * @openapi
   * /rh/types-contrat/{id}:
   *   put:
   *     tags: [RH - Types de contrat]
   *     summary: Met à jour un type de contrat
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
   *               code:
   *                 type: string
   *               libelle:
   *                 type: string
   *     responses:
   *       200:
   *         description: Type de contrat mis à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhTypeContratController.update)
  /**
   * @openapi
   * /rh/types-contrat/{id}:
   *   delete:
   *     tags: [RH - Types de contrat]
   *     summary: Supprime un type de contrat
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Type de contrat supprimé
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhTypeContratController.delete)

export default router
