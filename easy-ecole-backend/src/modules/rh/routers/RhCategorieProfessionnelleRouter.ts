import express from "express"
import RhCategorieProfessionnelleController from "../controllers/RhCategorieProfessionnelleController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/categories-professionnelles:
   *   get:
   *     tags: [RH - Catégories professionnelles]
   *     summary: Liste toutes les catégories professionnelles
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des catégories professionnelles
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhCategorieProfessionnelleController.getAll)
  /**
   * @openapi
   * /rh/categories-professionnelles/{id}:
   *   get:
   *     tags: [RH - Catégories professionnelles]
   *     summary: Récupère une catégorie professionnelle par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la catégorie professionnelle
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhCategorieProfessionnelleController.get)
  /**
   * @openapi
   * /rh/categories-professionnelles:
   *   post:
   *     tags: [RH - Catégories professionnelles]
   *     summary: Crée une nouvelle catégorie professionnelle
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
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Catégorie professionnelle créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhCategorieProfessionnelleController.create)
  /**
   * @openapi
   * /rh/categories-professionnelles/{id}:
   *   put:
   *     tags: [RH - Catégories professionnelles]
   *     summary: Met à jour une catégorie professionnelle
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
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Catégorie professionnelle mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhCategorieProfessionnelleController.update)
  /**
   * @openapi
   * /rh/categories-professionnelles/{id}:
   *   delete:
   *     tags: [RH - Catégories professionnelles]
   *     summary: Supprime une catégorie professionnelle
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Catégorie professionnelle supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhCategorieProfessionnelleController.delete)

export default router
