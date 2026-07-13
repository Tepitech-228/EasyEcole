import express from "express"
import RhBulletinPaieController from "../controllers/RhBulletinPaieController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/bulletins-paie:
   *   get:
   *     tags: [RH - Bulletins de paie]
   *     summary: Liste tous les bulletins de paie
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des bulletins
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhBulletinPaieController.getAll)
  /**
   * @openapi
   * /rh/bulletins-paie/{id}:
   *   get:
   *     tags: [RH - Bulletins de paie]
   *     summary: Récupère un bulletin de paie par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails du bulletin avec lignes
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhBulletinPaieController.get)
  /**
   * @openapi
   * /rh/bulletins-paie/{id}/valider:
   *   patch:
   *     tags: [RH - Bulletins de paie]
   *     summary: Valide un bulletin de paie
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Bulletin validé
   */
  .patch('/:id/valider', [Authenticate, AuthRessourcesHumaines], RhBulletinPaieController.valider)
  /**
   * @openapi
   * /rh/bulletins-paie/{id}/verser:
   *   patch:
   *     tags: [RH - Bulletins de paie]
   *     summary: Marque un bulletin comme versé
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Bulletin versé
   */
  .patch('/:id/verser', [Authenticate, AuthRessourcesHumaines], RhBulletinPaieController.verser)

export default router
