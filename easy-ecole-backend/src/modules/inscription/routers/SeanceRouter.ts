import express from "express"

import SeanceController from "../controllers/SeanceController"

const router = express.Router()

router
    .get('/', SeanceController.getAllSeances)
    .post('/', [], SeanceController.createSeance)
    .get('/planning', SeanceController.getPlanning)
    .get('/statistics/count', [], SeanceController.getCount)
    .post('/check-conflits', [], SeanceController.checkConflits)
    .post('/publier', [], SeanceController.publierEmploiDuTemps)
    .get('/rappel-salle', SeanceController.getRappelSalle)
    .get('/:id', SeanceController.getSeance)
    .put('/:id', [], SeanceController.updateSeance)
    .delete('/:id', [], SeanceController.deleteSeance)

export default router