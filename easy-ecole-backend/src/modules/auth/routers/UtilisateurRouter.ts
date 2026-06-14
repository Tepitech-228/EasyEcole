import express from "express"

import UtilisateurController from "../controllers/UtilisateurController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router()

router
    .get('/', [AuthInstitution], UtilisateurController.getAllUtilisateurs)
    .get('/:id', UtilisateurController.getUtilisateur)
    .put('/', UtilisateurController.updateUtilisateur)
    .delete('/:id', [AuthInstitution], UtilisateurController.deleteUtilisateur)
    .get('/statistics/count', [AuthInstitution], UtilisateurController.getCount)

export default router