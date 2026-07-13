import express from "express"
import QuizController from "../controllers/QuizController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
router
  .get('/', [Authenticate], QuizController.getAll)
  .post('/', [Authenticate], QuizController.create)
  .get('/:id', [Authenticate], QuizController.get)
  .post('/:id/repondre', [Authenticate], QuizController.repondre)
  .get('/:id/resultat', [Authenticate], QuizController.resultat)
  .delete('/:id', [Authenticate], QuizController.delete)

export default router
