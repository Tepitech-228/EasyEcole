import express from "express"

import ClasseController from "../controllers/ClasseController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

/**
 * @openapi
 * /inscription/classes:
 *   get:
 *     tags: [Classes]
 *     summary: Liste toutes les classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des classes
 */
router
    .get('/', ClasseController.getAllClasses)

/**
 * @openapi
 * /inscription/classes:
 *   post:
 *     tags: [Classes]
 *     summary: Crée une nouvelle classe
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
 *         description: Classe créée
 */
    .post('/', [AuthInstitution], ClasseController.createClasse)

/**
 * @openapi
 * /inscription/classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Récupère une classe par ID
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
 *         description: Classe trouvée
 */
    .get('/:id', ClasseController.getClasse)

/**
 * @openapi
 * /inscription/classes/{id}:
 *   put:
 *     tags: [Classes]
 *     summary: Met à jour une classe
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
 *         description: Classe mise à jour
 */
    .put('/:id', [AuthInstitution], ClasseController.updateClasse)

/**
 * @openapi
 * /inscription/classes/{id}:
 *   delete:
 *     tags: [Classes]
 *     summary: Supprime une classe
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
 *         description: Classe supprimée
 */
    .delete('/:id', [AuthInstitution], ClasseController.deleteClasse)

/**
 * @openapi
 * /inscription/classes/statistics/count:
 *   get:
 *     tags: [Classes]
 *     summary: Compte le nombre de classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de classes
 */
    .get('/statistics/count', [AuthInstitution], ClasseController.getCount)

export default router