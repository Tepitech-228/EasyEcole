import express from "express"

import AffectationSalleClasseController from "../controllers/AffectationSalleClasseController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /inscription/affectations-salles-classes:
 *   get:
 *     tags: [Affectations salle-classe]
 *     summary: Liste toutes les affectations salle ↔ classe (filtres optionnels)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des affectations
 */
router
    .get('/', AffectationSalleClasseController.getAllAffectations)

/**
 * @openapi
 * /inscription/affectations-salles-classes:
 *   post:
 *     tags: [Affectations salle-classe]
 *     summary: Crée une affectation salle ↔ classe (avec contrôle de chevauchement)
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
 *         description: Affectation créée
 *       409:
 *         description: Conflit de chevauchement détecté
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.affectation.creer')], AffectationSalleClasseController.createAffectation)

/**
 * @openapi
 * /inscription/affectations-salles-classes/statistics/count:
 *   get:
 *     tags: [Affectations salle-classe]
 *     summary: Retourne le nombre total d'affectations
 *     responses:
 *       200:
 *         description: Nombre d'affectations
 */
    .get('/statistics/count', [AuthInstitution], AffectationSalleClasseController.getCount)

/**
 * @openapi
 * /inscription/affectations-salles-classes/{id}:
 *   get:
 *     tags: [Affectations salle-classe]
 *     summary: Récupère une affectation par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail de l'affectation
 *       404:
 *         description: Affectation non trouvée
 */
    .get('/:id', AffectationSalleClasseController.getAffectation)

/**
 * @openapi
 * /inscription/affectations-salles-classes/{id}:
 *   put:
 *     tags: [Affectations salle-classe]
 *     summary: Met à jour une affectation (avec contrôle de chevauchement)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affectation mise à jour
 *       404:
 *         description: Affectation non trouvée
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.affectation.modifier')], AffectationSalleClasseController.updateAffectation)

/**
 * @openapi
 * /inscription/affectations-salles-classes/{id}:
 *   delete:
 *     tags: [Affectations salle-classe]
 *     summary: Supprime une affectation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affectation supprimée
 *       404:
 *         description: Affectation non trouvée
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.affectation.supprimer')], AffectationSalleClasseController.deleteAffectation)

export default router
