import express from "express"

import DemandeOrientationController from "../controllers/DemandeOrientationController"

const router = express.Router()

router
    .get('/', DemandeOrientationController.getAllDemandesOrientation)
    .post('/', [], DemandeOrientationController.createDemandeOrientation)
    .get('/:id', DemandeOrientationController.getDemandeOrientation)
    // .put('/:id', [], DemandeOrientationController.updateDemandeOrientation)
    .delete('/:id', [], DemandeOrientationController.deleteDemandeOrientation)
    .get('/statistics/count', [], DemandeOrientationController.getCount)

export default router