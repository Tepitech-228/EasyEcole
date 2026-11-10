import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import { AuthPilotagePedagogique } from "../../../core/middlewares/AuthPilotagePedagogique"

import SeanceController from "../controllers/SeanceController"
import SeancePointageController from "../controllers/SeancePointageController"

const router = express.Router()

router
    .get('/', SeanceController.getAllSeances)
    .post('/', [AuthPilotagePedagogique], SeanceController.createSeance)
    .get('/planning', SeanceController.getPlanning)
    .get('/volumes-horaires', [Authenticate, AuthPilotagePedagogique], SeanceController.getVolumesHoraires)
    .get('/volumes-enseignants', [Authenticate, AuthPilotagePedagogique], SeanceController.getVolumesEnseignants)
    .get('/retards-enseignants', [Authenticate, AuthPilotagePedagogique], SeanceController.getRetardsEnseignants)
    .get('/statistics/count', [], SeanceController.getCount)
    .post('/check-conflits', [AuthPilotagePedagogique], SeanceController.checkConflits)
    .post('/publier', [AuthPilotagePedagogique], SeanceController.publierEmploiDuTemps)
    .get('/tableau-de-bord', [Authenticate, AuthEnseignant], SeanceController.getTeacherDashboard)
    .post('/:id/pointage/debut', [Authenticate, AuthEnseignant], SeancePointageController.pointerDebut)
    .post('/:id/pointage/fin', [Authenticate, AuthEnseignant], SeancePointageController.pointerFin)
    .get('/:id', SeanceController.getSeance)
    .put('/:id', [AuthPilotagePedagogique], SeanceController.updateSeance)
    .delete('/:id', [AuthPilotagePedagogique], SeanceController.deleteSeance)

export default router