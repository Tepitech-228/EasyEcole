import express from "express"

import CreneauController from "../controllers/CreneauController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /inscription/creneaux:
 *   get:
 *     tags: [Créneaux]
 *     summary: Liste tous les créneaux horaires (filtres optionnels)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des créneaux
 */
router
    .get('/', CreneauController.getAllCreneaux)

/**
 * @openapi
 * /inscription/creneaux:
 *   post:
 *     tags: [Créneaux]
 *     summary: Crée un nouveau créneau horaire
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
 *         description: Créneau créé
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.creneau.creer')], CreneauController.createCreneau)

/**
 * @openapi
 * /inscription/creneaux/statistics/count:
 *   get:
 *     tags: [Créneaux]
 *     summary: Retourne le nombre total de créneaux
 *     responses:
 *       200:
 *         description: Nombre de créneaux
 */
    .get('/statistics/count', [AuthInstitution], CreneauController.getCount)

/**
 * @openapi
 * /inscription/creneaux/{id}:
 *   get:
 *     tags: [Créneaux]
 *     summary: Récupère un créneau par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail du créneau
 *       404:
 *         description: Créneau non trouvé
 */
    .get('/:id', CreneauController.getCreneau)

/**
 * @openapi
 * /inscription/creneaux/{id}:
 *   put:
 *     tags: [Créneaux]
 *     summary: Met à jour un créneau
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Créneau mis à jour
 *       404:
 *         description: Créneau non trouvé
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.creneau.modifier')], CreneauController.updateCreneau)

/**
 * @openapi
 * /inscription/creneaux/{id}:
 *   delete:
 *     tags: [Créneaux]
 *     summary: Supprime un créneau
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Créneau supprimé
 *       404:
 *         description: Créneau non trouvé
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.creneau.supprimer')], CreneauController.deleteCreneau)

export default router
