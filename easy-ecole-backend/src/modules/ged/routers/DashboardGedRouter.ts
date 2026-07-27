import express from "express";
import DashboardGedController from "../controllers/DashboardGedController";
import Authenticate from "../../../core/middlewares/Authenticate";

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
.get('/', [Authenticate], DashboardGedController.global)
        /**
     * @openapi
     * /par-domaine:
     *   get:
     *     tags: [GED]
     *     summary: GET /par-domaine
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/par-domaine', [Authenticate], DashboardGedController.parDomaine)
        /**
     * @openapi
     * /recent:
     *   get:
     *     tags: [GED]
     *     summary: GET /recent
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/recent', [Authenticate], DashboardGedController.recentActivity);

export default router;
