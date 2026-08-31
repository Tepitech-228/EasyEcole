import express from "express"
import CompteBancaireController from "../controllers/CompteBancaireController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEsacompta } from "../../../core/middlewares/AuthEsacompta"

const router = express.Router()

router
  .get('/', [Authenticate, AuthEsacompta], CompteBancaireController.getAll)
  .get('/:id', [Authenticate, AuthEsacompta], CompteBancaireController.get)
  .post('/', [Authenticate, AuthEsacompta], CompteBancaireController.create)
  .put('/:id', [Authenticate, AuthEsacompta], CompteBancaireController.update)
  .delete('/:id', [Authenticate, AuthEsacompta], CompteBancaireController.delete)

export default router
