import express from "express"

import MatierePrerequisController from "../controllers/MatierePrerequisController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

router
    .get('/', MatierePrerequisController.getAllMatieresPrerequis)
    .post('/', [AuthInstitution], MatierePrerequisController.createMatierePrerequis)
    .get('/:id', MatierePrerequisController.getMatierePrerequis)
    .put('/:id', [AuthInstitution], MatierePrerequisController.updateMatierePrerequis)
    .delete('/:id', [AuthInstitution], MatierePrerequisController.deleteMatierePrerequis)
    .get('/statistics/count', [AuthInstitution], MatierePrerequisController.getCount)

export default router