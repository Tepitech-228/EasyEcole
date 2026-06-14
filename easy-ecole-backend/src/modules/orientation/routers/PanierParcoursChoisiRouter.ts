import express from "express"

import PanierParcoursChoisiController from "../controllers/PanierParcoursChoisiController"

const router = express.Router()

router
    .get('/', PanierParcoursChoisiController.getAllPanierParcoursChoisi)
    .post('/', [], PanierParcoursChoisiController.createPanierParcoursChoisi)
    .get('/:id', PanierParcoursChoisiController.getPanierParcoursChoisi)
    .put('/:id', [], PanierParcoursChoisiController.updatePanierParcoursChoisi)
    .delete('/:id', [], PanierParcoursChoisiController.deletePanierParcoursChoisi)
    .delete('/', [], PanierParcoursChoisiController.deleteAllPanierParcoursChoisi)
    .get('/statistics/count', [], PanierParcoursChoisiController.getCount)

export default router