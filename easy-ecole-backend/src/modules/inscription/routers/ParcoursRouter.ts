import express from "express"

import ParcoursController from "../controllers/ParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

/**
 * @openapi
 * /inscription/parcours:
 *   get:
 *     tags: [Parcours]
 *     summary: Liste tous les parcours
 *     responses:
 *       200:
 *         description: Liste des parcours
 */
router
    .get('/', ParcoursController.getAllParcours)
/**
 * @openapi
 * /inscription/parcours:
 *   post:
 *     tags: [Parcours]
 *     summary: Crée un nouveau parcours
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
 *         description: Parcours créé
 */
    .post('/', [AuthInstitution], ParcoursController.createParcours)
/**
 * @openapi
 * /inscription/parcours/{id}:
 *   get:
 *     tags: [Parcours]
 *     summary: Récupère un parcours par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du parcours
 *     responses:
 *       200:
 *         description: Détail du parcours
 *       404:
 *         description: Parcours non trouvé
 */
    .get('/:id', ParcoursController.getParcours)
/**
 * @openapi
 * /inscription/parcours/{id}:
 *   put:
 *     tags: [Parcours]
 *     summary: Met à jour un parcours
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
 *         description: Parcours mis à jour
 *       404:
 *         description: Parcours non trouvé
 */
    .put('/:id', [AuthInstitution], ParcoursController.updateParcours)
/**
 * @openapi
 * /inscription/parcours/{id}:
 *   delete:
 *     tags: [Parcours]
 *     summary: Supprime un parcours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parcours supprimé
 *       404:
 *         description: Parcours non trouvé
 */
    .delete('/:id', [AuthInstitution], ParcoursController.deleteParcours)
/**
 * @openapi
 * /inscription/parcours/statistics/count:
 *   get:
 *     tags: [Parcours]
 *     summary: Retourne le nombre total de parcours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de parcours
 */
    .get('/statistics/count', [AuthInstitution], ParcoursController.getCount)

export default router