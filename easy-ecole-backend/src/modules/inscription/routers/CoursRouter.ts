import express from "express"

import CoursController from "../controllers/CoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', CoursController.getAllCours)
    .post('/', [AuthInstitution], CoursController.createCours)
    .get('/:id', CoursController.getCours)
    .get('/:id/participants', CoursController.getCoursParticipants)
    .put('/:id', [AuthInstitution], CoursController.updateCours)
    .put('/:id/enseignant', [AuthInstitution], CoursController.assignerCours)
    .delete('/:id/enseignant', [AuthInstitution], CoursController.revoquerAssignationCours)
    .delete('/:id', [AuthInstitution], CoursController.deleteCours)
    .get('/statistics/count', [AuthInstitution], CoursController.getCount)

export default router