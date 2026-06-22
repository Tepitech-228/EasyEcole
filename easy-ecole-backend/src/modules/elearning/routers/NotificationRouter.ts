import express from "express"
import NotificationController from "../controllers/NotificationController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], NotificationController.getAll)
    .post('/', [Authenticate], NotificationController.envoyerNotification)
    .put('/:id/lu', [Authenticate], NotificationController.marquerLu)

export default router
