import express from "express"

import SessionController from "../controllers/SessionController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', SessionController.getAllSessions)
    .post('/', [AuthInstitution], SessionController.createSession)
    .get('/:id', SessionController.getSession)
    .put('/:id', [AuthInstitution], SessionController.updateSession)
    .delete('/:id', [AuthInstitution], SessionController.deleteSession)
    .get('/statistics/count', [AuthInstitution], SessionController.getCount)

export default router