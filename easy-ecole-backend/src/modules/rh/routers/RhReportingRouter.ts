import express from "express"
import RhReportingController from "../controllers/RhReportingController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/stats', [Authenticate], RhReportingController.getStats)
  .get('/masse-salariale', [Authenticate], RhReportingController.getMasseSalariale)
  .get('/effectifs', [Authenticate], RhReportingController.getEffectifs)
  .get('/situation-prets', [Authenticate], RhReportingController.getSituationPrets)

export default router
