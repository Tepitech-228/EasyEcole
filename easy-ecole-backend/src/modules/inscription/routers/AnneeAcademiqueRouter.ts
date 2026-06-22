import express from "express"

import AnneeAcademiqueController from "../controllers/AnneeAcademiqueController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

/**
 * @openapi
 * /inscription/anneesAcademiques:
 *   get:
 *     tags: [Années Académiques]
 *     summary: Liste toutes les années académiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des années académiques
 */
router
    .get('/', AnneeAcademiqueController.getAllAnneesAcademiques)

/**
 * @openapi
 * /inscription/anneesAcademiques:
 *   post:
 *     tags: [Années Académiques]
 *     summary: Crée une nouvelle année académique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               libelle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Année académique créée
 */
    .post('/', [AuthInstitution], AnneeAcademiqueController.createAnneeAcademique)

/**
 * @openapi
 * /inscription/anneesAcademiques/{id}:
 *   get:
 *     tags: [Années Académiques]
 *     summary: Récupère une année académique par ID
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
 *         description: Année académique trouvée
 */
    .get('/:id', AnneeAcademiqueController.getAnneeAcademique)

/**
 * @openapi
 * /inscription/anneesAcademiques/{id}:
 *   put:
 *     tags: [Années Académiques]
 *     summary: Met à jour une année académique
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
 *             properties:
 *               libelle:
 *                 type: string
 *     responses:
 *       200:
 *         description: Année académique mise à jour
 */
    .put('/:id', [AuthInstitution], AnneeAcademiqueController.updateAnneeAcademique)

/**
 * @openapi
 * /inscription/anneesAcademiques/{id}:
 *   delete:
 *     tags: [Années Académiques]
 *     summary: Supprime une année académique
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
 *         description: Année académique supprimée
 */
    .delete('/:id', [AuthInstitution], AnneeAcademiqueController.deleteAnneeAcademique)

/**
 * @openapi
 * /inscription/anneesAcademiques/statistics/count:
 *   get:
 *     tags: [Années Académiques]
 *     summary: Compte le nombre d'années académiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre d'années académiques
 */
    .get('/statistics/count', [AuthInstitution], AnneeAcademiqueController.getCount)

export default router