import express from "express"

import ParcoursController from "../controllers/ParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', ParcoursController.getAllParcours)
    .post('/', [AuthInstitution], ParcoursController.createParcours)
    .get('/:id', ParcoursController.getParcours)
    .put('/:id', [AuthInstitution], ParcoursController.updateParcours)
    .delete('/:id', [AuthInstitution], ParcoursController.deleteParcours)
    .get('/statistics/count', [AuthInstitution], ParcoursController.getCount)

export default router