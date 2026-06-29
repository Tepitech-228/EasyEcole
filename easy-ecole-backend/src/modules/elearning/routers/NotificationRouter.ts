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

/**
 * @openapi
 * /elearning/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Envoie une notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Notification envoyée
 */
    .post('/', [Authenticate], NotificationController.envoyerNotification)

/**
 * @openapi
 * /elearning/notifications/{id}/lu:
 *   put:
 *     tags: [Notifications]
 *     summary: Marque une notification comme lue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 */
    .put('/:id/lu', [Authenticate], NotificationController.marquerLu)

export default router
