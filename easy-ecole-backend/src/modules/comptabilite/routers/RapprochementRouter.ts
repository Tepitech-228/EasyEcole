import express from "express"
import RapprochementController from "../controllers/RapprochementController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/non-rapprochees', [Authenticate], RapprochementController.getNonRapprochees)
  .post('/rapprocher', [Authenticate], RapprochementController.rapprocher)
  .post('/defaire/:id', [Authenticate], RapprochementController.defaireRapprochement)
  .post('/lettrer', [Authenticate], RapprochementController.lettrer)
  .get('/situation/:compteId', [Authenticate], RapprochementController.getSituationCompte)

export default router
