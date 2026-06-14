import express from "express"

import InstitutionController from "../controllers/InstitutionController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', InstitutionController.getAllInstitutions)
    .get('/:id', InstitutionController.getInstitution)
    .put('/', [AuthInstitution], InstitutionController.updateInstitution)
    .delete('/', [AuthInstitution], InstitutionController.deleteInstitution)
    .get('/statistics/count', [AuthInstitution], InstitutionController.getCount)

export default router