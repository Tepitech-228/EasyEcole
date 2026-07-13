import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportConsolideController from "../controllers/RapportConsolideController";

const router = express.Router();

/**
 * @openapi
 * /reporting/consolide/dashboard:
 *   get:
 *     tags: [Rapports Consolidés]
 *     summary: Tableau de bord consolidé
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tableau de bord consolidé
 */
router
    .get('/dashboard', [Authenticate], RapportConsolideController.getDashboard)

export default router;
