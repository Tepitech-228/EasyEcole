import express from "express"

import SeanceController from "../controllers/SeanceController"

const router = express.Router()

router
    .get('/', SeanceController.getAllSeances)
    .post('/', [], SeanceController.createSeance)
    .get('/:id', SeanceController.getSeance)
    .put('/:id', [], SeanceController.updateSeance)
    .delete('/:id', [], SeanceController.deleteSeance)
    .get('/statistics/count', [], SeanceController.getCount)

export default router