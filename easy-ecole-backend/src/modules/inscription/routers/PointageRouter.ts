import express from "express"

import PointageController from "../controllers/PointageController"

const router = express.Router()

router
    .get('/', PointageController.getAllPointages)
    .get('/today', PointageController.getTodayPointage)
    .post('/arrivee', [], PointageController.pointerArrivee)
    .post('/depart', [], PointageController.pointerDepart)
    .post('/scan/arrivee', [], PointageController.pointerArriveeByScan)

export default router
