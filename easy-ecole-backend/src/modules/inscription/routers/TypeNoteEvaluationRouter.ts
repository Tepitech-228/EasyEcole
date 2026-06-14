import express from "express"

import TypeNoteEvaluationController from "../controllers/TypeNoteEvaluationController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', TypeNoteEvaluationController.getAllTypesNoteEvaluation)
    .post('/', [AuthInstitution], TypeNoteEvaluationController.createTypeNoteEvaluation)
    .get('/:id', TypeNoteEvaluationController.getTypeNoteEvaluation)
    .put('/:id', [AuthInstitution], TypeNoteEvaluationController.updateTypeNoteEvaluation)
    .delete('/:id', [AuthInstitution], TypeNoteEvaluationController.deleteTypeNoteEvaluation)
    .get('/statistics/count', [AuthInstitution], TypeNoteEvaluationController.getCount)

export default router