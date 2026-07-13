import express from "express"
import RhPeriodePaieController from "../controllers/RhPeriodePaieController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/periodes-paie:
   *   get:
   *     tags: [RH - Périodes de paie]
   *     summary: Liste toutes les périodes de paie
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des périodes de paie
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.getAll)
  /**
   * @openapi
   * /rh/periodes-paie/{id}:
   *   get:
   *     tags: [RH - Périodes de paie]
   *     summary: Récupère une période de paie par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la période
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.get)
  /**
   * @openapi
   * /rh/periodes-paie:
   *   post:
   *     tags: [RH - Périodes de paie]
   *     summary: Crée une nouvelle période de paie
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               mois:
   *                 type: integer
   *               annee:
   *                 type: integer
   *               dateDebut:
   *                 type: string
   *                 format: date
   *               dateFin:
   *                 type: string
   *                 format: date
   *     responses:
   *       201:
   *         description: Période créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.create)
  /**
   * @openapi
   * /rh/periodes-paie/{id}:
   *   put:
   *     tags: [RH - Périodes de paie]
   *     summary: Met à jour une période de paie
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
   *                 enum: [ouverte, verrouillée]
   *     responses:
   *       200:
   *         description: Période mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.update)
  /**
   * @openapi
   * /rh/periodes-paie/{id}:
   *   delete:
   *     tags: [RH - Périodes de paie]
   *     summary: Supprime une période de paie
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Période supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.delete)
  /**
   * @openapi
   * /rh/periodes-paie/{id}/generer:
   *   post:
   *     tags: [RH - Périodes de paie]
   *     summary: Génère les bulletins de paie pour une période
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Bulletins générés
   */
  .post('/:id/generer', [Authenticate, AuthRessourcesHumaines], RhPeriodePaieController.genererBulletins)

export default router
