import express from "express"

import FraisInscriptionController from "../controllers/FraisInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()

/**
 * @openapi
 * /inscription/fraisInscription:
 *   get:
 *     tags: [Frais d'Inscription]
 *     summary: Liste tous les frais d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des frais d'inscription
 */
router
    .get('/', FraisInscriptionController.getAllFraisInscription)

/**
 * @openapi
 * /inscription/fraisInscription:
 *   post:
 *     tags: [Frais d'Inscription]
 *     summary: Crée un nouveau frais d'inscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Frais d'inscription créé
 */
    .post('/', [], FraisInscriptionController.createFraisInscription)

/**
 * @openapi
 * /inscription/fraisInscription/{id}:
 *   get:
 *     tags: [Frais d'Inscription]
 *     summary: Récupère un frais d'inscription par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Frais d'inscription trouvé
 */
    .get('/:id', FraisInscriptionController.getFraisInscription)

/**
 * @openapi
 * /inscription/fraisInscription/{id}:
 *   put:
 *     tags: [Frais d'Inscription]
 *     summary: Met à jour un frais d'inscription
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Frais d'inscription mis à jour
 */
    .put('/:id', [], FraisInscriptionController.updateFraisInscription)

/**
 * @openapi
 * /inscription/fraisInscription/{id}:
 *   delete:
 *     tags: [Frais d'Inscription]
 *     summary: Supprime un frais d'inscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Frais d'inscription supprimé
 */
    .delete('/:id', [], FraisInscriptionController.deleteFraisInscription)

/**
 * @openapi
 * /inscription/fraisInscription/statistics/count:
 *   get:
 *     tags: [Frais d'Inscription]
 *     summary: Compte le nombre de frais d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de frais d'inscription
 */
    .get('/statistics/count', [], FraisInscriptionController.getCount)

export default router