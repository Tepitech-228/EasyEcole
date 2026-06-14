import express from "express"

import AnneeAcademiqueController from "../controllers/AnneeAcademiqueController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', AnneeAcademiqueController.getAllAnneesAcademiques)
    .post('/', [AuthInstitution], AnneeAcademiqueController.createAnneeAcademique)
    .get('/:id', AnneeAcademiqueController.getAnneeAcademique)
    .put('/:id', [AuthInstitution], AnneeAcademiqueController.updateAnneeAcademique)
    .delete('/:id', [AuthInstitution], AnneeAcademiqueController.deleteAnneeAcademique)
    .get('/statistics/count', [AuthInstitution], AnneeAcademiqueController.getCount)

export default router