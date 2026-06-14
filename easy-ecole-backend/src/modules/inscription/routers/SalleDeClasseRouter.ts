import express from "express"

import SalleDeClasseController from "../controllers/SalleDeClasseController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', SalleDeClasseController.getAllSallesDeClasse)
    .post('/', [AuthInstitution], SalleDeClasseController.createSalleDeClasse)
    .get('/:id', SalleDeClasseController.getSalleDeClasse)
    .put('/:id', [AuthInstitution], SalleDeClasseController.updateSalleDeClasse)
    .delete('/:id', [AuthInstitution], SalleDeClasseController.deleteSalleDeClasse)
    .get('/statistics/count', [AuthInstitution], SalleDeClasseController.getCount)

export default router