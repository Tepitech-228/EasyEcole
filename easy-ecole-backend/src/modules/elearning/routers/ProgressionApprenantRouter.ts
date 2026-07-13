import express from "express"
import ProgressionApprenantController from "../controllers/ProgressionApprenantController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
router
  .post('/marquer-termine', [Authenticate], ProgressionApprenantController.marquerTermine)
  .get('/cours/:coursId', [Authenticate], ProgressionApprenantController.getProgressionCours)

export default router
