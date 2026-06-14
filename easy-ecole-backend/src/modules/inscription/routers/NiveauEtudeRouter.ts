import express from "express"

import NiveauEtudeController from "../controllers/NiveauEtudeController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

router
    .get('/', NiveauEtudeController.getAllNiveauxEtude)
    .post('/', [AuthInstitution], NiveauEtudeController.createNiveauEtude)
    .get('/:id', NiveauEtudeController.getNiveauEtude)
    .put('/:id', [AuthInstitution], NiveauEtudeController.updateNiveauEtude)
    .delete('/:id', [AuthInstitution], NiveauEtudeController.deleteNiveauEtude)
    .get('/statistics/count', [AuthInstitution], NiveauEtudeController.getCount)

export default router