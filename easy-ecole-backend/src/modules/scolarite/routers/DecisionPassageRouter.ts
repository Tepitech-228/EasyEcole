import express from "express"
import DecisionPassageController from "../controllers/DecisionPassageController"

const router = express.Router()

router
    .get('/', DecisionPassageController.getAll)
    .post('/', DecisionPassageController.create)
    .get('/byCursus/:cursusId', DecisionPassageController.getByCursus)
    .get('/byAnnee/:anneeId', DecisionPassageController.getByAnnee)
    .get('/:id', DecisionPassageController.get)
    .put('/:id', DecisionPassageController.update)
    .delete('/:id', DecisionPassageController.delete)

export default router
