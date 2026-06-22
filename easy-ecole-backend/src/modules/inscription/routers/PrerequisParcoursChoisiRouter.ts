import express from "express"

import PrerequisParcoursChoisiController from "../controllers/PrerequisParcoursChoisiController"

const router = express.Router()

/**
 * @openapi
 * /inscription/prerequisParcoursChoisis:
 *   get:
 *     tags: [Parcours]
 *     summary: Liste tous les prérequis de parcours choisis
 *     responses:
 *       200:
 *         description: Liste des prérequis
 */
router
    .get('/', PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi)
/**
 * @openapi
 * /inscription/prerequisParcoursChoisis:
 *   post:
 *     tags: [Parcours]
 *     summary: Crée un nouveau prérequis de parcours choisi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Prérequis créé
 */
    .post('/', [], PrerequisParcoursChoisiController.createPrerequisParcoursChoisi)
/**
 * @openapi
 * /inscription/prerequisParcoursChoisis/{id}:
 *   get:
 *     tags: [Parcours]
 *     summary: Récupère un prérequis de parcours choisi par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du prérequis
 *     responses:
 *       200:
 *         description: Détail du prérequis
 *       404:
 *         description: Prérequis non trouvé
 */
    .get('/:id', PrerequisParcoursChoisiController.getPrerequisParcoursChoisi)
/**
 * @openapi
 * /inscription/prerequisParcoursChoisis/{id}:
 *   put:
 *     tags: [Parcours]
 *     summary: Met à jour un prérequis de parcours choisi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Prérequis mis à jour
 *       404:
 *         description: Prérequis non trouvé
 */
    .put('/:id', [], PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi)
/**
 * @openapi
 * /inscription/prerequisParcoursChoisis/{id}:
 *   delete:
 *     tags: [Parcours]
 *     summary: Supprime un prérequis de parcours choisi
 *     responses:
 *       200:
 *         description: Prérequis supprimé
 *       404:
 *         description: Prérequis non trouvé
 */
    .delete('/:id', [], PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi)
/**
 * @openapi
 * /inscription/prerequisParcoursChoisis/statistics/count:
 *   get:
 *     tags: [Parcours]
 *     summary: Retourne le nombre total de prérequis de parcours choisis
 *     responses:
 *       200:
 *         description: Nombre de prérequis
 */
    .get('/statistics/count', [], PrerequisParcoursChoisiController.getCount)

export default router