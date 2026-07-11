import express from "express"
import NotificationController from "../controllers/NotificationController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

/**
 * @openapi
 * /elearning/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Liste toutes les notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router
    .get('/', [Authenticate], NotificationController.getAll)
    .get('/count', [Authenticate], NotificationController.getCount)
    .put('/lire-toutes', [Authenticate], NotificationController.marquerToutesLues)
    .put('/:id/lu', [Authenticate], NotificationController.marquerLu)
    .post('/', [Authenticate], NotificationController.envoyerNotification)

export default router
