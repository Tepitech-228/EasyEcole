import express from "express"

import CursusApprenantController from "../controllers/CursusApprenantController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /inscription/cursusApprenant:
 *   get:
 *     tags: [Cursus Apprenant]
 *     summary: Liste tous les cursus apprenant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des cursus apprenant
 */
router
    .get('/', CursusApprenantController.getAllCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant:
 *   post:
 *     tags: [Cursus Apprenant]
 *     summary: Crée un nouveau cursus apprenant
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
 *         description: Cursus apprenant créé
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.cursus.creer')], CursusApprenantController.createCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant/{id}:
 *   get:
 *     tags: [Cursus Apprenant]
 *     summary: Récupère un cursus apprenant par ID
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
 *         description: Cursus apprenant trouvé
 */
    .get('/:id', CursusApprenantController.getCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant/{id}/cours:
 *   get:
 *     tags: [Cursus Apprenant]
 *     summary: Récupère les cours choisis d'un cursus apprenant
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
 *         description: Cours choisis du cursus apprenant
 */
    .get('/:id/cours', CursusApprenantController.getCoursChoisisCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant/{id}:
 *   put:
 *     tags: [Cursus Apprenant]
 *     summary: Met à jour un cursus apprenant
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
 *         description: Cursus apprenant mis à jour
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.cursus.modifier')], CursusApprenantController.updateCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant/{id}:
 *   delete:
 *     tags: [Cursus Apprenant]
 *     summary: Supprime un cursus apprenant
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
 *         description: Cursus apprenant supprimé
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.cursus.supprimer')], CursusApprenantController.deleteCursusApprenant)

/**
 * @openapi
 * /inscription/cursusApprenant/statistics/count:
 *   get:
 *     tags: [Cursus Apprenant]
 *     summary: Compte le nombre de cursus apprenant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de cursus apprenant
 */
    .get('/statistics/count', [AuthInstitution], CursusApprenantController.getCount)

export default router