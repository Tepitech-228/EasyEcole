import express from "express"

import ListeNoteEvaluationController from "../controllers/ListeNoteEvaluationController"

const router = express.Router()

router
    .get('/', ListeNoteEvaluationController.getAllListesNoteEvaluation)
    .post('/', [], ListeNoteEvaluationController.createListeNoteEvaluation)
    .get('/:id', ListeNoteEvaluationController.getListeNoteEvaluation)
    .put('/:id', [], ListeNoteEvaluationController.updateListeNoteEvaluation)
    .delete('/:id', [], ListeNoteEvaluationController.deleteListeNoteEvaluation)
    .get('/statistics/count', [], ListeNoteEvaluationController.getCount)

export default router