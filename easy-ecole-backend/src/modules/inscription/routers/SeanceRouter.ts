import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

import SeanceController from "../controllers/SeanceController"

const router = express.Router()

router
    .get('/', SeanceController.getAllSeances)
    .post('/', [AuthInstitution], SeanceController.createSeance)
    .get('/planning', SeanceController.getPlanning)
    .get('/statistics/count', [], SeanceController.getCount)
    .post('/check-conflits', [AuthInstitution], SeanceController.checkConflits)
    .post('/publier', [AuthInstitution], SeanceController.publierEmploiDuTemps)
    .get('/tableau-de-bord', [Authenticate, AuthEnseignant], SeanceController.getTeacherDashboard)
    .get('/:id', SeanceController.getSeance)
    .put('/:id', [AuthInstitution], SeanceController.updateSeance)
    .delete('/:id', [AuthInstitution], SeanceController.deleteSeance)

export default router