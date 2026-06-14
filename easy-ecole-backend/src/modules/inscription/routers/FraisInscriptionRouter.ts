import express from "express"

import FraisInscriptionController from "../controllers/FraisInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()

router
    .get('/', FraisInscriptionController.getAllFraisInscription)
    .post('/', [], FraisInscriptionController.createFraisInscription)
    .get('/:id', FraisInscriptionController.getFraisInscription)
    .put('/:id', [], FraisInscriptionController.updateFraisInscription)
    .delete('/:id', [], FraisInscriptionController.deleteFraisInscription)
    .get('/statistics/count', [], FraisInscriptionController.getCount)

export default router