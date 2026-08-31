import express from "express"
import RapprochementController from "../controllers/RapprochementController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEsacompta } from "../../../core/middlewares/AuthEsacompta"

const router = express.Router()

router
  .get('/non-rapprochees', [Authenticate, AuthEsacompta], RapprochementController.getNonRapprochees)
  .post('/rapprocher', [Authenticate, AuthEsacompta], RapprochementController.rapprocher)
  .post('/defaire/:id', [Authenticate, AuthEsacompta], RapprochementController.defaireRapprochement)
  .post('/lettrer', [Authenticate, AuthEsacompta], RapprochementController.lettrer)
  .get('/situation/:compteId', [Authenticate, AuthEsacompta], RapprochementController.getSituationCompte)

export default router
