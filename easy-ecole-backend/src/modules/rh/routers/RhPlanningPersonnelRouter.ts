import express from "express"
import RhPlanningPersonnelController from "../controllers/RhPlanningPersonnelController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/personnel', [Authenticate], RhPlanningPersonnelController.getPersonnelPlanning)
  .get('/', [Authenticate], RhPlanningPersonnelController.getAll)
  .get('/:id', [Authenticate], RhPlanningPersonnelController.get)
  .post('/', [Authenticate], RhPlanningPersonnelController.create)
  .put('/:id', [Authenticate], RhPlanningPersonnelController.update)
  .delete('/:id', [Authenticate], RhPlanningPersonnelController.delete)

export default router
