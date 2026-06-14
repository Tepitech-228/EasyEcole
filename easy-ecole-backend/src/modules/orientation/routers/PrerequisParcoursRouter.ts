import express from "express"

import PrerequisParcoursController from "../controllers/PrerequisParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

router
    .get('/', PrerequisParcoursController.getAllPrerequisParcours)
    .post('/', [AuthInstitution], PrerequisParcoursController.createPrerequisParcours)
    .get('/:id', PrerequisParcoursController.getPrerequisParcours)
    .put('/:id', [AuthInstitution], PrerequisParcoursController.updatePrerequisParcours)
    .delete('/:id', [AuthInstitution], PrerequisParcoursController.deletePrerequisParcours)
    .get('/statistics/count', [AuthInstitution], PrerequisParcoursController.getCount)

export default router