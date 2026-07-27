import express from "express"
import CompteBancaireController from "../controllers/CompteBancaireController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], CompteBancaireController.getAll)
  .get('/:id', [Authenticate], CompteBancaireController.get)
  .post('/', [Authenticate], CompteBancaireController.create)
  .put('/:id', [Authenticate], CompteBancaireController.update)
  .delete('/:id', [Authenticate], CompteBancaireController.delete)

export default router
