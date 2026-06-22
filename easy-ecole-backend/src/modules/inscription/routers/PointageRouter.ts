import express from "express"

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
    .get('/', PointageController.getAllPointages)
/**
 * @openapi
 * /inscription/pointages/today:
 *   get:
 *     tags: [Pointage]
 *     summary: Récupère les pointages du jour
 *     responses:
 *       200:
 *         description: Pointages du jour
 */
    .get('/today', PointageController.getTodayPointage)
/**
 * @openapi
 * /inscription/pointages/arrivee:
 *   post:
 *     tags: [Pointage]
 *     summary: Enregistre une arrivée (pointage)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Arrivée enregistrée
 */
    .post('/arrivee', [], PointageController.pointerArrivee)
/**
 * @openapi
 * /inscription/pointages/depart:
 *   post:
 *     tags: [Pointage]
 *     summary: Enregistre un départ (pointage)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Départ enregistré
 */
    .post('/depart', [], PointageController.pointerDepart)
/**
 * @openapi
 * /inscription/pointages/scan/arrivee:
 *   post:
 *     tags: [Pointage]
 *     summary: Enregistre une arrivée par scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Arrivée par scan enregistrée
 */
    .post('/scan/arrivee', [], PointageController.pointerArriveeByScan)

export default router
