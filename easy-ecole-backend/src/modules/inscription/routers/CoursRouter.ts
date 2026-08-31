import express from "express"

import CoursController from "../controllers/CoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { InscriptionComplete } from "../../../core/middlewares/InscriptionComplete";
import { cache } from "../../../core/middlewares/CacheMiddleware";

const router = express.Router()

/**
 * @openapi
 * /inscription/cours:
 *   get:
 *     tags: [Cours]
 *     summary: Liste tous les cours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des cours
 */
router
    // Référentiel stable → cache Redis 300 s (liste)
    .get('/', [cache(300)], CoursController.getAllCours)

/**
 * @openapi
 * /inscription/cours:
 *   post:
 *     tags: [Cours]
 *     summary: Crée un nouveau cours
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
 *         description: Cours créé
 */
    .post('/', [AuthInstitution, CheckPermission('action.inscription.cours.creer')], CoursController.createCours)

/**
 * @openapi
 * /inscription/cours/mes-presences:
 *   get:
 *     tags: [Cours]
 *     summary: Récupère les présences de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des présences
 */
    .get('/mes-presences', [InscriptionComplete], CoursController.getMesPresences)

/**
 * @openapi
 * /inscription/cours/arbre-pedagogique:
 *   get:
 *     tags: [Cours]
 *     summary: Retourne l'arbre pédagogique complet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arbre pédagogique
 */
    .get('/arbre-pedagogique', [], CoursController.getArbrePedagogique)

/**
 * @openapi
 * /inscription/cours/{id}:
 *   get:
 *     tags: [Cours]
 *     summary: Récupère un cours par ID
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
 *         description: Cours trouvé
 */
    .get('/:id', [cache(300)], CoursController.getCours)

/**
 * @openapi
 * /inscription/cours/{id}/participants:
 *   get:
 *     tags: [Cours]
 *     summary: Récupère les participants d'un cours
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
 *         description: Participants du cours
 */
    .get('/:id/participants', [InscriptionComplete], CoursController.getCoursParticipants)

/**
 * @openapi
 * /inscription/cours/{id}:
 *   put:
 *     tags: [Cours]
 *     summary: Met à jour un cours
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
 *         description: Cours mis à jour
 */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.cours.modifier')], CoursController.updateCours)

/**
 * @openapi
 * /inscription/cours/{id}/enseignant:
 *   put:
 *     tags: [Cours]
 *     summary: Assigne un enseignant à un cours
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
 *         description: Enseignant assigné
 */
    .put('/:id/enseignant', [AuthInstitution, CheckPermission('action.inscription.cours.assigner-enseignant')], CoursController.assignerCours)

/**
 * @openapi
 * /inscription/cours/{id}/enseignant:
 *   delete:
 *     tags: [Cours]
 *     summary: Révoque l'assignation d'un enseignant à un cours
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
 *         description: Assignation révoquée
 */
    .delete('/:id/enseignant', [AuthInstitution, CheckPermission('action.inscription.cours.retirer-enseignant')], CoursController.revoquerAssignationCours)

/**
 * @openapi
 * /inscription/cours/{id}:
 *   delete:
 *     tags: [Cours]
 *     summary: Supprime un cours
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
 *         description: Cours supprimé
 */
    .delete('/:id', [AuthInstitution, CheckPermission('action.inscription.cours.supprimer')], CoursController.deleteCours)

/**
 * @openapi
 * /inscription/cours/statistics/count:
 *   get:
 *     tags: [Cours]
 *     summary: Compte le nombre de cours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de cours
 */
    .get('/statistics/count', [AuthInstitution], CoursController.getCount)

export default router