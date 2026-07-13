import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportRHController from "../controllers/RapportRHController";

const router = express.Router();

/**
 * @openapi
 * /reporting/rh/effectifs:
 *   get:
 *     tags: [Rapports RH]
 *     summary: Rapport des effectifs RH
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des effectifs RH
 */
router
    .get('/effectifs', [Authenticate], RapportRHController.getEffectifs)

/**
 * @openapi
 * /reporting/rh/paie:
 *   get:
 *     tags: [Rapports RH]
 *     summary: Rapport de la paie
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport de la paie
 */
    .get('/paie', [Authenticate], RapportRHController.getPaie)

/**
 * @openapi
 * /reporting/rh/formations:
 *   get:
 *     tags: [Rapports RH]
 *     summary: Rapport des formations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des formations
 */
    .get('/formations', [Authenticate], RapportRHController.getFormations)

/**
 * @openapi
 * /reporting/rh/evaluations:
 *   get:
 *     tags: [Rapports RH]
 *     summary: Rapport des évaluations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des évaluations
 */
    .get('/evaluations', [Authenticate], RapportRHController.getEvaluations)

export default router;
