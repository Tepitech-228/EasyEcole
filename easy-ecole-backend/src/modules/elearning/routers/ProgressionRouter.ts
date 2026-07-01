import express from "express"
import ProgressionController from "../controllers/ProgressionController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
router
  .get('/', [Authenticate], ProgressionController.getProgression)

export default router
