import express from "express"

import CursusApprenantController from "../controllers/CursusApprenantController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', CursusApprenantController.getAllCursusApprenant)
    .post('/', [AuthInstitution], CursusApprenantController.createCursusApprenant)
    .get('/:id', CursusApprenantController.getCursusApprenant)
    .get('/:id/cours', CursusApprenantController.getCoursChoisisCursusApprenant)
    .put('/:id', [AuthInstitution], CursusApprenantController.updateCursusApprenant)
    .delete('/:id', [AuthInstitution], CursusApprenantController.deleteCursusApprenant)
    .get('/statistics/count', [AuthInstitution], CursusApprenantController.getCount)

export default router