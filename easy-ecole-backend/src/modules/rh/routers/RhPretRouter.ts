import express from "express"
import RhPretController from "../controllers/RhPretController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], RhPretController.getAll)
  .get('/by-employe/:employeId', [Authenticate], RhPretController.getByEmploye)
  .get('/:id', [Authenticate], RhPretController.get)
  .post('/simuler', [Authenticate], RhPretController.simuler)
  .post('/', [Authenticate], RhPretController.create)
  .put('/:id', [Authenticate], RhPretController.update)
  .delete('/:id', [Authenticate], RhPretController.delete)

export default router
