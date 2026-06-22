import express from "express"

import RessourceController from "../controllers/RessourceController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"

const router = express.Router()

/**
 * @openapi
 * /inscription/ressources:
 *   get:
 *     tags: [Ressources]
 *     summary: Liste toutes les ressources
 *     responses:
 *       200:
 *         description: Liste des ressources
 */
router
    .get('/', RessourceController.getAllRessources)
/**
 * @openapi
 * /inscription/ressources:
 *   post:
 *     tags: [Ressources]
 *     summary: Crée une nouvelle ressource
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
 *         description: Ressource créée
 */
    .post('/', [AuthEnseignant], RessourceController.createRessource)
/**
 * @openapi
 * /inscription/ressources/{id}:
 *   get:
 *     tags: [Ressources]
 *     summary: Récupère une ressource par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la ressource
 *     responses:
 *       200:
 *         description: Détail de la ressource
 *       404:
 *         description: Ressource non trouvée
 */
    .get('/:id', RessourceController.getRessource)
/**
 * @openapi
 * /inscription/ressources/{id}:
 *   put:
 *     tags: [Ressources]
 *     summary: Met à jour une ressource
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ressource mise à jour
 *       404:
 *         description: Ressource non trouvée
 */
    .put('/:id', [AuthEnseignant], RessourceController.updateRessource)
/**
 * @openapi
 * /inscription/ressources/{id}:
 *   delete:
 *     tags: [Ressources]
 *     summary: Supprime une ressource
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ressource supprimée
 *       404:
 *         description: Ressource non trouvée
 */
    .delete('/:id', [AuthEnseignant], RessourceController.deleteRessource)
/**
 * @openapi
 * /inscription/ressources/statistics/count:
 *   get:
 *     tags: [Ressources]
 *     summary: Retourne le nombre total de ressources
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de ressources
 */
    .get('/statistics/count', [AuthEnseignant], RessourceController.getCount)

export default router