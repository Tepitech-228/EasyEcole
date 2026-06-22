import express from "express"

import MatierePrerequisController from "../controllers/MatierePrerequisController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

/**
 * @openapi
 * /inscription/matieres:
 *   get:
 *     tags: [Matières Prérequis]
 *     summary: Liste toutes les matières prérequis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des matières prérequis
 */
router
    .get('/', MatierePrerequisController.getAllMatieresPrerequis)

/**
 * @openapi
 * /inscription/matieres:
 *   post:
 *     tags: [Matières Prérequis]
 *     summary: Crée une nouvelle matière prérequis
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
 *         description: Matière prérequis créée
 */
    .post('/', [AuthInstitution], MatierePrerequisController.createMatierePrerequis)

/**
 * @openapi
 * /inscription/matieres/{id}:
 *   get:
 *     tags: [Matières Prérequis]
 *     summary: Récupère une matière prérequis par ID
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
 *         description: Matière prérequis trouvée
 */
    .get('/:id', MatierePrerequisController.getMatierePrerequis)

/**
 * @openapi
 * /inscription/matieres/{id}:
 *   put:
 *     tags: [Matières Prérequis]
 *     summary: Met à jour une matière prérequis
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
 *         description: Matière prérequis mise à jour
 */
    .put('/:id', [AuthInstitution], MatierePrerequisController.updateMatierePrerequis)

/**
 * @openapi
 * /inscription/matieres/{id}:
 *   delete:
 *     tags: [Matières Prérequis]
 *     summary: Supprime une matière prérequis
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
 *         description: Matière prérequis supprimée
 */
    .delete('/:id', [AuthInstitution], MatierePrerequisController.deleteMatierePrerequis)

/**
 * @openapi
 * /inscription/matieres/statistics/count:
 *   get:
 *     tags: [Matières Prérequis]
 *     summary: Compte le nombre de matières prérequis
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de matières prérequis
 */
    .get('/statistics/count', [AuthInstitution], MatierePrerequisController.getCount)

export default router