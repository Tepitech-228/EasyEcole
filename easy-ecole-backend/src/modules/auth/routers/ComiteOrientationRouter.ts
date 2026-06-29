import express from "express"

import ComiteOrientationController from "../controllers/ComiteOrientationController"
import { AuthComiteOrientation } from "../../../core/middlewares/AuthComiteOrientation"

const router = express.Router()

router
    .get('/', [AuthComiteOrientation], ComiteOrientationController.getProfile)
    .put('/', [AuthComiteOrientation], ComiteOrientationController.updateProfile)

export default router
