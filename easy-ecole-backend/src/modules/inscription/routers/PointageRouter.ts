import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"

import PointageController from "../controllers/PointageController"

const router = express.Router()

/**
 * @openapi
 * /inscription/pointages:
 *   get:
 *     tags: [Pointage]
 *     summary: Liste tous les pointages
 *     responses:
 *       200:
 *         description: Liste des pointages
 */
router
    .get('/', [Authenticate], PointageController.getAllPointages)
    .get('/today', [Authenticate], PointageController.getTodayPointage)
    .post('/arrivee', [Authenticate], PointageController.pointerArrivee)
    .post('/depart', [Authenticate], PointageController.pointerDepart)
    .post('/scan/arrivee', [Authenticate], PointageController.pointerArriveeByScan)
    .post('/scan/depart', [Authenticate], PointageController.pointerDepartByScan)
    .get('/scan/verifier-statut/:codeQR', [Authenticate], PointageController.verifierStatutByQR)

export default router
