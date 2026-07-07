import express from "express"
import PenaliteRetardController from "../controllers/PenaliteRetardController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], PenaliteRetardController.getAll)
  .get('/by-frais-parcours/:fraisParcoursId', [Authenticate], PenaliteRetardController.getByFraisParcours)
  .get('/:id', [Authenticate], PenaliteRetardController.get)
  .post('/', [Authenticate], PenaliteRetardController.create)
  .put('/:id', [Authenticate], PenaliteRetardController.update)
  .delete('/:id', [Authenticate], PenaliteRetardController.delete)

export default router
