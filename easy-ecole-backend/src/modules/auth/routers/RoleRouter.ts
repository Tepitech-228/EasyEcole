import express from "express";
import RoleController from "../controllers/RoleController";

const router = express.Router();

router
    .get('/', RoleController.getAllRoles)
    .get('/:id', RoleController.getRole)
    .post('/', RoleController.createRole)
    .put('/:id', RoleController.updateRole)
    .delete('/:id', RoleController.deleteRole)
    .get('/:id/permissions', RoleController.getRolePermissions)
    .put('/:id/permissions', RoleController.updateRolePermissions)
    .get('/:id/utilisateurs', RoleController.getRoleUtilisateurs)
    .post('/:id/utilisateurs', RoleController.assignRoleToUser)
    .delete('/:id/utilisateurs/:utilisateurId', RoleController.removeRoleFromUser)
    .get('/utilisateurs/:utilisateurId', RoleController.getUtilisateurRoles)
    .post('/:id/appliquer/:utilisateurId', RoleController.appliquerRolePermissions)

export default router;
