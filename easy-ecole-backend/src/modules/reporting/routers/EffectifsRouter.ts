import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportEffectifsController from "../controllers/RapportEffectifsController";

const router = express.Router();

/**
 * @openapi
 * /reporting/effectifs:
 *   get:
 *     tags: [Rapports Effectifs]
 *     summary: Rapport des effectifs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapport des effectifs
 */
router
    .get('/', [Authenticate], RapportEffectifsController.getAll)

/**
 * @openapi
 * /reporting/effectifs/summary:
 *   get:
 *     tags: [Rapports Effectifs]
 *     summary: Résumé des effectifs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Résumé des effectifs
 */
    .get('/summary', [Authenticate], RapportEffectifsController.getSummary)

export default router;
