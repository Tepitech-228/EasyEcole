import express from "express"
import FraisParcoursController from "../controllers/FraisParcoursController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], FraisParcoursController.getAll)
  .get('/by-parcours/:parcoursId', [Authenticate], FraisParcoursController.getByParcours)
  .get('/:id', [Authenticate], FraisParcoursController.get)
  .post('/', [Authenticate], FraisParcoursController.create)
  .put('/:id', [Authenticate], FraisParcoursController.update)
  .delete('/:id', [Authenticate], FraisParcoursController.delete)

export default router
