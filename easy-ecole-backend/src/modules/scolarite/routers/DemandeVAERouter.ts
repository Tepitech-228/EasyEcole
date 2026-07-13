import express from "express"
import DemandeVAEController from "../controllers/DemandeVAEController"

const router = express.Router()

router
    .get('/', DemandeVAEController.getAll)
    .post('/', DemandeVAEController.create)
    .put('/traiter/:id', DemandeVAEController.traiter)
    .get('/:id', DemandeVAEController.get)
    .put('/:id', DemandeVAEController.update)

export default router
