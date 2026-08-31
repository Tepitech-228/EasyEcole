import express from "express"
import ReleveBancaireController from "../controllers/ReleveBancaireController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEsacompta } from "../../../core/middlewares/AuthEsacompta"

const router = express.Router()

router
  .get('/', [Authenticate, AuthEsacompta], ReleveBancaireController.getAll)
  .get('/:id', [Authenticate, AuthEsacompta], ReleveBancaireController.get)
  .post('/', [Authenticate, AuthEsacompta], ReleveBancaireController.create)
  .put('/:id', [Authenticate, AuthEsacompta], ReleveBancaireController.update)
  .delete('/:id', [Authenticate, AuthEsacompta], ReleveBancaireController.delete)

export default router
