import express from "express"

import PrerequisParcoursChoisiController from "../controllers/PrerequisParcoursChoisiController"

const router = express.Router()

router
    .get('/', PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi)
    .post('/', [], PrerequisParcoursChoisiController.createPrerequisParcoursChoisi)
    .get('/:id', PrerequisParcoursChoisiController.getPrerequisParcoursChoisi)
    .put('/:id', [], PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi)
    .delete('/:id', [], PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi)
    .get('/statistics/count', [], PrerequisParcoursChoisiController.getCount)

export default router