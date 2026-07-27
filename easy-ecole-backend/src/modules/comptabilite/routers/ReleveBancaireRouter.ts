import express from "express"
import ReleveBancaireController from "../controllers/ReleveBancaireController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], ReleveBancaireController.getAll)
  .get('/:id', [Authenticate], ReleveBancaireController.get)
  .post('/', [Authenticate], ReleveBancaireController.create)
  .put('/:id', [Authenticate], ReleveBancaireController.update)
  .delete('/:id', [Authenticate], ReleveBancaireController.delete)

export default router
