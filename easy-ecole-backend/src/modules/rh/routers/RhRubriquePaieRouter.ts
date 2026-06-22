import express from "express"
import RhRubriquePaieController from "../controllers/RhRubriquePaieController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/rubriques-paie:
   *   get:
   *     tags: [RH - Rubriques paie]
   *     summary: Liste toutes les rubriques de paie
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des rubriques de paie
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhRubriquePaieController.getAll)
  /**
   * @openapi
   * /rh/rubriques-paie/{id}:
   *   get:
   *     tags: [RH - Rubriques paie]
   *     summary: Récupère une rubrique de paie par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la rubrique
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhRubriquePaieController.get)
  /**
   * @openapi
   * /rh/rubriques-paie:
   *   post:
   *     tags: [RH - Rubriques paie]
   *     summary: Crée une nouvelle rubrique de paie
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
   *               type:
   *                 type: string
   *                 enum: [gain, retenue, cotisation]
   *               modeCalcul:
   *                 type: string
   *                 enum: [fixe, pourcentage, formule]
   *               valeur:
   *                 type: number
   *               imposable:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Rubrique créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhRubriquePaieController.create)
  /**
   * @openapi
   * /rh/rubriques-paie/{id}:
   *   put:
   *     tags: [RH - Rubriques paie]
   *     summary: Met à jour une rubrique de paie
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
   *               valeur:
   *                 type: number
   *     responses:
   *       200:
   *         description: Rubrique mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhRubriquePaieController.update)
  /**
   * @openapi
   * /rh/rubriques-paie/{id}:
   *   delete:
   *     tags: [RH - Rubriques paie]
   *     summary: Supprime une rubrique de paie
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Rubrique supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhRubriquePaieController.delete)

export default router
