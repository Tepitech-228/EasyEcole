import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportAchatsController from "../controllers/RapportAchatsController";

const router = express.Router();

/**
 * @openapi
 * /reporting/achats:
 *   get:
 *     tags: [Rapports Achats]
 *     summary: Rapport des achats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des achats
 */
router
    .get('/', [Authenticate], RapportAchatsController.getAchats)

/**
 * @openapi
 * /reporting/achats/stocks:
 *   get:
 *     tags: [Rapports Achats]
 *     summary: Rapport des stocks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des stocks
 */
    .get('/stocks', [Authenticate], RapportAchatsController.getStocks)

/**
 * @openapi
 * /reporting/achats/immobilisations:
 *   get:
 *     tags: [Rapports Achats]
 *     summary: Rapport des immobilisations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des immobilisations
 */
    .get('/immobilisations', [Authenticate], RapportAchatsController.getImmobilisations)

export default router;
