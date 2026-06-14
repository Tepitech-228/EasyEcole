import express from "express"

import ParcoursChoisiController from "../controllers/ParcoursChoisiController"

const router = express.Router()

router
    .get('/', ParcoursChoisiController.getAllParcoursChoisis)
    .post('/', [], ParcoursChoisiController.createParcoursChoisi)
    .get('/:id', ParcoursChoisiController.getParcoursChoisi)
    .put('/:id', [], ParcoursChoisiController.updateParcoursChoisi)
    .delete('/:id', [], ParcoursChoisiController.deleteParcoursChoisi)
    .get('/statistics/count', [], ParcoursChoisiController.getCount)

export default router