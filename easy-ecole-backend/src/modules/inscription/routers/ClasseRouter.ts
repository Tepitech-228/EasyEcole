import express from "express"

import ClasseController from "../controllers/ClasseController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', ClasseController.getAllClasses)
    .post('/', [AuthInstitution], ClasseController.createClasse)
    .get('/:id', ClasseController.getClasse)
    .put('/:id', [AuthInstitution], ClasseController.updateClasse)
    .delete('/:id', [AuthInstitution], ClasseController.deleteClasse)
    .get('/statistics/count', [AuthInstitution], ClasseController.getCount)

export default router