import express from "express"

import ParcoursChoisiController from "../controllers/ParcoursChoisiController"

const router = express.Router()

/**
 * @openapi
 * /inscription/parcoursChoisis:
 *   get:
 *     tags: [Parcours]
 *     summary: Liste tous les parcours choisis
 *     responses:
 *       200:
 *         description: Liste des parcours choisis
 */
router
    .get('/', ParcoursChoisiController.getAllParcoursChoisis)
/**
 * @openapi
 * /inscription/parcoursChoisis:
 *   post:
 *     tags: [Parcours]
 *     summary: Crée un nouveau parcours choisi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Parcours choisi créé
 */
    .post('/', [], ParcoursChoisiController.createParcoursChoisi)
/**
 * @openapi
 * /inscription/parcoursChoisis/{id}:
 *   get:
 *     tags: [Parcours]
 *     summary: Récupère un parcours choisi par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du parcours choisi
 *     responses:
 *       200:
 *         description: Détail du parcours choisi
 *       404:
 *         description: Parcours choisi non trouvé
 */
    .get('/:id', ParcoursChoisiController.getParcoursChoisi)
/**
 * @openapi
 * /inscription/parcoursChoisis/{id}:
 *   put:
 *     tags: [Parcours]
 *     summary: Met à jour un parcours choisi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Parcours choisi mis à jour
 *       404:
 *         description: Parcours choisi non trouvé
 */
    .put('/:id', [], ParcoursChoisiController.updateParcoursChoisi)
/**
 * @openapi
 * /inscription/parcoursChoisis/{id}:
 *   delete:
 *     tags: [Parcours]
 *     summary: Supprime un parcours choisi
 *     responses:
 *       200:
 *         description: Parcours choisi supprimé
 *       404:
 *         description: Parcours choisi non trouvé
 */
    .delete('/:id', [], ParcoursChoisiController.deleteParcoursChoisi)
/**
 * @openapi
 * /inscription/parcoursChoisis/statistics/count:
 *   get:
 *     tags: [Parcours]
 *     summary: Retourne le nombre total de parcours choisis
 *     responses:
 *       200:
 *         description: Nombre de parcours choisis
 */
    .get('/statistics/count', [], ParcoursChoisiController.getCount)

export default router