import express from "express"

import InstitutionController from "../controllers/InstitutionController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /auth/institutions:
 *   get:
 *     tags: [Institutions]
 *     summary: Liste toutes les institutions
 *     responses:
 *       200:
 *         description: Liste des institutions
 */
router
    .get('/', InstitutionController.getAllInstitutions)
    /**
     * @openapi
     * /auth/institutions/{id}:
     *   get:
     *     tags: [Institutions]
     *     summary: Obtenir une institution par ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Institution trouvée
     *       404:
     *         description: Institution non trouvée
     */
    .get('/:id', InstitutionController.getInstitution)
    /**
     * @openapi
     * /auth/institutions:
     *   put:
     *     tags: [Institutions]
     *     summary: Mettre à jour une institution
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nom:
     *                 type: string
     *               adresse:
     *                 type: string
     *               telephone:
     *                 type: string
     *     responses:
     *       200:
     *         description: Institution mise à jour
     *       401:
     *         description: Non autorisé
     */
    .put('/', [AuthInstitution, CheckPermission('action.administration.institution.modifier')], InstitutionController.updateInstitution)
    /**
     * @openapi
     * /auth/institutions:
     *   delete:
     *     tags: [Institutions]
     *     summary: Supprimer une institution
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Institution supprimée
     *       401:
     *         description: Non autorisé
     */
    .delete('/', [AuthInstitution, CheckPermission('action.administration.institution.supprimer')], InstitutionController.deleteInstitution)
    /**
     * @openapi
     * /auth/institutions/statistics/count:
     *   get:
     *     tags: [Institutions]
     *     summary: Nombre total d'institutions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques
     *       401:
     *         description: Non autorisé
     */
    .get('/statistics/count', [AuthInstitution], InstitutionController.getCount)

export default router