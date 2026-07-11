import express from "express"
import PenaliteRetardController from "../controllers/PenaliteRetardController"

const router = express.Router()

router
  .get('/', PenaliteRetardController.getAll)
  .get('/:id', PenaliteRetardController.get)
  .post('/', PenaliteRetardController.create)
  .put('/:id', PenaliteRetardController.update)
  .delete('/:id', PenaliteRetardController.delete)

export default router
