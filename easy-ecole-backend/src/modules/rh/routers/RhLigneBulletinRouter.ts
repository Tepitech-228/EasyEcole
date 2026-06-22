import express from "express"
import RhLigneBulletinController from "../controllers/RhLigneBulletinController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/lignes-bulletin:
   *   get:
   *     tags: [RH - Lignes bulletin]
   *     summary: Liste toutes les lignes de bulletin
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des lignes
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhLigneBulletinController.getAll)
  /**
   * @openapi
   * /rh/lignes-bulletin/{id}:
   *   get:
   *     tags: [RH - Lignes bulletin]
   *     summary: Récupère une ligne de bulletin par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la ligne
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhLigneBulletinController.get)
  /**
   * @openapi
   * /rh/lignes-bulletin:
   *   post:
   *     tags: [RH - Lignes bulletin]
   *     summary: Crée une nouvelle ligne de bulletin
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               bulletinId:
   *                 type: string
   *               rubriqueId:
   *                 type: string
   *               libelle:
   *                 type: string
   *               base:
   *                 type: number
   *               taux:
   *                 type: number
   *               montant:
   *                 type: number
   *     responses:
   *       201:
   *         description: Ligne créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhLigneBulletinController.create)
  /**
   * @openapi
   * /rh/lignes-bulletin/{id}:
   *   put:
   *     tags: [RH - Lignes bulletin]
   *     summary: Met à jour une ligne de bulletin
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
   *               base:
   *                 type: number
   *               taux:
   *                 type: number
   *               montant:
   *                 type: number
   *     responses:
   *       200:
   *         description: Ligne mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhLigneBulletinController.update)
  /**
   * @openapi
   * /rh/lignes-bulletin/{id}:
   *   delete:
   *     tags: [RH - Lignes bulletin]
   *     summary: Supprime une ligne de bulletin
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Ligne supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhLigneBulletinController.delete)

export default router
