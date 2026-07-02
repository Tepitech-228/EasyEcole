import express from "express"

import UtilisateurController from "../controllers/UtilisateurController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/**
 * @openapi
 * /auth/utilisateurs:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Liste tous les utilisateurs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *       401:
 *         description: Non autorisé
 */
router
    .get('/', [Authenticate], UtilisateurController.getAllUtilisateurs)
    /**
     * @openapi
     * /auth/utilisateurs/{id}:
     *   get:
     *     tags: [Utilisateurs]
     *     summary: Obtenir un utilisateur par ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Utilisateur trouvé
     *       404:
     *         description: Utilisateur non trouvé
     */
    .get('/:id', UtilisateurController.getUtilisateur)
    /**
     * @openapi
     * /auth/utilisateurs:
     *   put:
     *     tags: [Utilisateurs]
     *     summary: Mettre à jour un utilisateur
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *     responses:
     *       200:
     *         description: Utilisateur mis à jour
     */
    .put('/', UtilisateurController.updateUtilisateur)
    /**
     * @openapi
     * /auth/utilisateurs/{id}:
     *   delete:
     *     tags: [Utilisateurs]
     *     summary: Supprimer un utilisateur
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
     *         description: Utilisateur supprimé
     *       401:
     *         description: Non autorisé
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.administration.utilisateur.supprimer')], UtilisateurController.deleteUtilisateur)
    /**
     * @openapi
     * /auth/utilisateurs/statistics/count:
     *   get:
     *     tags: [Utilisateurs]
     *     summary: Nombre total d'utilisateurs
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques
     *       401:
     *         description: Non autorisé
     */
    .get('/statistics/count', [AuthInstitution], UtilisateurController.getCount)

export default router