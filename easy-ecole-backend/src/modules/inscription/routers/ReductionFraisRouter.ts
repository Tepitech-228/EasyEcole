import express from "express"
import ReductionFraisController from "../controllers/ReductionFraisController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], ReductionFraisController.getAll)
  .get('/by-frais-parcours/:fraisParcoursId', [Authenticate], ReductionFraisController.getByFraisParcours)
  .get('/:id', [Authenticate], ReductionFraisController.get)
  .post('/', [Authenticate], ReductionFraisController.create)
  .put('/:id', [Authenticate], ReductionFraisController.update)
  .delete('/:id', [Authenticate], ReductionFraisController.delete)

export default router
