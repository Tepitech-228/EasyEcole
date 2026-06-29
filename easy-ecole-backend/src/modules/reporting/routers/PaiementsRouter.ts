import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportPaiementsController from "../controllers/RapportPaiementsController";

const router = express.Router();

/**
 * @openapi
 * /reporting/paiements:
 *   get:
 *     tags: [Rapports Paiements]
 *     summary: Rapport des paiements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des paiements
 */
router
    .get('/', [Authenticate], RapportPaiementsController.getPaiements)

/**
 * @openapi
 * /reporting/paiements/factures:
 *   get:
 *     tags: [Rapports Paiements]
 *     summary: Rapport des factures
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des factures
 */
    .get('/factures', [Authenticate], RapportPaiementsController.getFactures)

/**
 * @openapi
 * /reporting/paiements/totaux:
 *   get:
 *     tags: [Rapports Paiements]
 *     summary: Rapport des totaux de paiements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des totaux de paiements
 */
    .get('/totaux', [Authenticate], RapportPaiementsController.getTotaux)

export default router;
