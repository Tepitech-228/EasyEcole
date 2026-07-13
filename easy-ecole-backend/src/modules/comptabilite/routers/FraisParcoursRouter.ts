import express from "express"
import FraisParcoursController from "../controllers/FraisParcoursController"

const router = express.Router()

router
  .get('/', FraisParcoursController.getAll)
  .get('/statistics/count', FraisParcoursController.getCount)
  .get('/:id', FraisParcoursController.get)
  .post('/', FraisParcoursController.create)
  .put('/:id', FraisParcoursController.update)
  .delete('/:id', FraisParcoursController.delete)

export default router
