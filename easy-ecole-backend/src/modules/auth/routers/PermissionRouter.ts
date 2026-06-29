import express from "express"
import PermissionController from "../controllers/PermissionController"
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router()

router
    .get('/', [Authenticate], PermissionController.getAllPermissions)
    .get('/flat', [Authenticate], PermissionController.getAllPermissionsFlat)
    .get('/utilisateur/:utilisateurId', [Authenticate], PermissionController.getUtilisateurPermissions)
    .put('/utilisateur/:utilisateurId', [Authenticate], PermissionController.updateUtilisateurPermissions)
    .post('/utilisateur/:utilisateurId/copy-from/:fromUtilisateurId', [Authenticate], PermissionController.copyPermissions)
    .post('/check', [Authenticate], PermissionController.check)
    .get('/mes-permissions', [Authenticate], PermissionController.mesPermissions)

export default router
