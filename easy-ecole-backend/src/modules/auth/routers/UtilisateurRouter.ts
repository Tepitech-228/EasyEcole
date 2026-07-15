import express from "express"

import UtilisateurController from "../controllers/UtilisateurController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

/** GET /auth/utilisateurs — Liste tous les utilisateurs (admin/institution) */
router
    .get('/', [Authenticate], UtilisateurController.getAllUtilisateurs)
    /** POST /auth/utilisateurs — Créer un utilisateur (admin/institution) */
    .post('/', [Authenticate], UtilisateurController.adminCreateUtilisateur)
    /** GET /auth/utilisateurs/:id — Obtenir un utilisateur par ID */
    .get('/:id', [Authenticate], UtilisateurController.getUtilisateur)
    /** PUT /auth/utilisateurs/:id — Modifier un utilisateur (admin/institution) */
    .put('/:id', [Authenticate], UtilisateurController.adminUpdateUtilisateur)
    /** PUT /auth/utilisateurs — Modifier son propre profil */
    .put('/', [Authenticate], UtilisateurController.updateUtilisateur)
    /** DELETE /auth/utilisateurs/:id — Supprimer un utilisateur (admin/institution) */
    .delete('/:id', [Authenticate], UtilisateurController.deleteUtilisateur)
    /** GET /auth/utilisateurs/statistics/count */
    .get('/statistics/count', [Authenticate], UtilisateurController.getCount)

export default router
