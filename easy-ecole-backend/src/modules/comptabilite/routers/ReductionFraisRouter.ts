import express from "express"
import ReductionFraisController from "../controllers/ReductionFraisController"

const router = express.Router()

router
  .get('/', ReductionFraisController.getAll)
  .get('/:id', ReductionFraisController.get)
  .post('/', ReductionFraisController.create)
  .put('/:id', ReductionFraisController.update)
  .delete('/:id', ReductionFraisController.delete)

export default router
