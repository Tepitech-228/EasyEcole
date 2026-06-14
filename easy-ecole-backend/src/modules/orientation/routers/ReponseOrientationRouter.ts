import express from "express"

import ReponseOrientationController from "../controllers/ReponseOrientationController"

const router = express.Router()

router
    .get('/', ReponseOrientationController.getAllReponsesOrientation)
    .post('/', [], ReponseOrientationController.createReponseOrientation)
    .get('/:id', ReponseOrientationController.getReponseOrientation)
    // .put('/:id', [], ReponseOrientationController.updateReponseOrientation)
    .delete('/:id', [], ReponseOrientationController.deleteReponseOrientation)
    .get('/statistics/count', [], ReponseOrientationController.getCount)

export default router