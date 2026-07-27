import express from "express";
import RoleController from "../controllers/RoleController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

function adminOnly(req: any, res: any, next: any) {
    if (req.utilisateurRole !== RolesUtilisateur.ADMIN && req.utilisateurRole !== RolesUtilisateur.INSTITUTION) {
        return res.status(403).json({ success: false, message: "Réservé à l'administration" });
    }
    next();
}

const router = express.Router();

router
    .get('/', [Authenticate, adminOnly], RoleController.getAllRoles)
    .get('/:id', [Authenticate, adminOnly], RoleController.getRole)
    .post('/', [Authenticate, adminOnly], RoleController.createRole)
    .put('/:id', [Authenticate, adminOnly], RoleController.updateRole)
    .delete('/:id', [Authenticate, adminOnly], RoleController.deleteRole)
    .get('/:id/permissions', [Authenticate, adminOnly], RoleController.getRolePermissions)
    .put('/:id/permissions', [Authenticate, adminOnly], RoleController.updateRolePermissions)
    .get('/:id/utilisateurs', [Authenticate, adminOnly], RoleController.getRoleUtilisateurs)
    .post('/:id/utilisateurs', [Authenticate, adminOnly], RoleController.assignRoleToUser)
    .delete('/:id/utilisateurs/:utilisateurId', [Authenticate, adminOnly], RoleController.removeRoleFromUser)
    .get('/utilisateurs/:utilisateurId', [Authenticate, adminOnly], RoleController.getUtilisateurRoles)
    .post('/:id/appliquer/:utilisateurId', [Authenticate, adminOnly], RoleController.appliquerRolePermissions)

export default router;
