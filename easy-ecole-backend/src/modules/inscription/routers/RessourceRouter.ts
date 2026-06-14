import express from "express"

import RessourceController from "../controllers/RessourceController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"

const router = express.Router()

router
    .get('/', RessourceController.getAllRessources)
    .post('/', [AuthEnseignant], RessourceController.createRessource)
    .get('/:id', RessourceController.getRessource)
    .put('/:id', [AuthEnseignant], RessourceController.updateRessource)
    .delete('/:id', [AuthEnseignant], RessourceController.deleteRessource)
    .get('/statistics/count', [AuthEnseignant], RessourceController.getCount)

export default router