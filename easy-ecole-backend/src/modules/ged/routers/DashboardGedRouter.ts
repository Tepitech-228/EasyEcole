import express from "express";
import DashboardGedController from "../controllers/DashboardGedController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { cache } from "../../../core/middlewares/CacheMiddleware";

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
.get('/', [Authenticate, cache(60)], DashboardGedController.global)
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
.get('/par-domaine', [Authenticate, cache(60)], DashboardGedController.parDomaine)
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
.get('/recent', [Authenticate, cache(60)], DashboardGedController.recentActivity);

export default router;
