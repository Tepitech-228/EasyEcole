import express from "express"

import PublicationNoteController from "../controllers/PublicationNoteController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], PublicationNoteController.getAll)
    .get('/mes-notes', [Authenticate], PublicationNoteController.getMesNotes)
    .get('/etudiant/:cursusId', [Authenticate], PublicationNoteController.getForStudent)
    .post('/:id/publier', [Authenticate], PublicationNoteController.publier)

export default router
