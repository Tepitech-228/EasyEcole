import express from "express"

import PrerequisParcoursController from "../controllers/PrerequisParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

/**
 * @openapi
 * /inscription/prerequisParcours:
 *   get:
 *     tags: [Parcours]
 *     summary: Liste tous les prérequis de parcours
 *     responses:
 *       200:
 *         description: Liste des prérequis
 */
router
    .get('/', PrerequisParcoursController.getAllPrerequisParcours)
/**
 * @openapi
 * /inscription/prerequisParcours:
 *   post:
 *     tags: [Parcours]
 *     summary: Crée un nouveau prérequis de parcours
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
 *         description: Prérequis créé
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.prerequis.creer')], PrerequisParcoursController.createPrerequisParcours)
/**
 * @openapi
 * /inscription/prerequisParcours/{id}:
 *   get:
 *     tags: [Parcours]
 *     summary: Récupère un prérequis de parcours par son ID
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
    .get('/:id', PrerequisParcoursController.getPrerequisParcours)
/**
 * @openapi
 * /inscription/prerequisParcours/{id}:
 *   put:
 *     tags: [Parcours]
 *     summary: Met à jour un prérequis de parcours
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
 *         description: Prérequis mis à jour
 *       404:
 *         description: Prérequis non trouvé
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.prerequis.modifier')], PrerequisParcoursController.updatePrerequisParcours)
/**
 * @openapi
 * /inscription/prerequisParcours/{id}:
 *   delete:
 *     tags: [Parcours]
 *     summary: Supprime un prérequis de parcours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prérequis supprimé
 *       404:
 *         description: Prérequis non trouvé
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.prerequis.supprimer')], PrerequisParcoursController.deletePrerequisParcours)
/**
 * @openapi
 * /inscription/prerequisParcours/statistics/count:
 *   get:
 *     tags: [Parcours]
 *     summary: Retourne le nombre total de prérequis de parcours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de prérequis
 */
    .get('/statistics/count', [AuthInstitution], PrerequisParcoursController.getCount)

export default router