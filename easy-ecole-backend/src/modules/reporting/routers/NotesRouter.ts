import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportNotesController from "../controllers/RapportNotesController";

const router = express.Router();

/**
 * @openapi
 * /reporting/notes/moyennes:
 *   get:
 *     tags: [Rapports Notes]
 *     summary: Rapport des moyennes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des moyennes
 */
router
    .get('/moyennes', [Authenticate], RapportNotesController.getMoyennes)

/**
 * @openapi
 * /reporting/notes/reussite:
 *   get:
 *     tags: [Rapports Notes]
 *     summary: Rapport des taux de réussite
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des taux de réussite
 */
    .get('/reussite', [Authenticate], RapportNotesController.getReussite)

export default router;
