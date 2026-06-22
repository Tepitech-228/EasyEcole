import express from "express"

import SeanceController from "../controllers/SeanceController"

const router = express.Router()

/**
 * @openapi
 * /inscription/seances:
 *   get:
 *     tags: [Séances]
 *     summary: Liste toutes les séances
 *     responses:
 *       200:
 *         description: Liste des séances
 */
router
    .get('/', SeanceController.getAllSeances)
/**
 * @openapi
 * /inscription/seances:
 *   post:
 *     tags: [Séances]
 *     summary: Crée une nouvelle séance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Séance créée
 */
    .post('/', [], SeanceController.createSeance)
/**
 * @openapi
 * /inscription/seances/{id}:
 *   get:
 *     tags: [Séances]
 *     summary: Récupère une séance par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la séance
 *     responses:
 *       200:
 *         description: Détail de la séance
 *       404:
 *         description: Séance non trouvée
 */
    .get('/:id', SeanceController.getSeance)
/**
 * @openapi
 * /inscription/seances/{id}:
 *   put:
 *     tags: [Séances]
 *     summary: Met à jour une séance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Séance mise à jour
 *       404:
 *         description: Séance non trouvée
 */
    .put('/:id', [], SeanceController.updateSeance)
/**
 * @openapi
 * /inscription/seances/{id}:
 *   delete:
 *     tags: [Séances]
 *     summary: Supprime une séance
 *     responses:
 *       200:
 *         description: Séance supprimée
 *       404:
 *         description: Séance non trouvée
 */
    .delete('/:id', [], SeanceController.deleteSeance)
/**
 * @openapi
 * /inscription/seances/statistics/count:
 *   get:
 *     tags: [Séances]
 *     summary: Retourne le nombre total de séances
 *     responses:
 *       200:
 *         description: Nombre de séances
 */
    .get('/statistics/count', [], SeanceController.getCount)

export default router