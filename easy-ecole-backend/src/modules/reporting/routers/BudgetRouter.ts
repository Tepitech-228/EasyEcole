import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportBudgetController from "../controllers/RapportBudgetController";

const router = express.Router();

/**
 * @openapi
 * /reporting/budget:
 *   get:
 *     tags: [Rapports Budget]
 *     summary: Rapport budget global
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport budget
 */
router
    .get('/', [Authenticate], RapportBudgetController.getAll)

/**
 * @openapi
 * /reporting/budget/ecart:
 *   get:
 *     tags: [Rapports Budget]
 *     summary: Rapport des écarts budgétaires
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des écarts budgétaires
 */
    .get('/ecart', [Authenticate], RapportBudgetController.getEcart)

export default router;
