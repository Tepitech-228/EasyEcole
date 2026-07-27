import express from "express";
import NotificationGedController from "../controllers/NotificationGedController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router();

router
        /**
     * @openapi
     * /:
     *   get:
     *     tags: [GED]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], NotificationGedController.list)
        /**
     * @openapi
     * /:id/read:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/read
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/read', [Authenticate], NotificationGedController.markAsRead)
        /**
     * @openapi
     * /read-all:
     *   post:
     *     tags: [GED]
     *     summary: POST /read-all
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/read-all', [Authenticate], NotificationGedController.markAllRead)
        /**
     * @openapi
     * /check-dua:
     *   post:
     *     tags: [GED]
     *     summary: POST /check-dua
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/check-dua', [Authenticate, AuthInstitution], NotificationGedController.runDUACheck);

export default router;
