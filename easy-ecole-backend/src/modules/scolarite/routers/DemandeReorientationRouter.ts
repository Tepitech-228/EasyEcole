import express from "express"
import DemandeReorientationController from "../controllers/DemandeReorientationController"

const router = express.Router()

router
    .get('/', DemandeReorientationController.getAll)
    .post('/', DemandeReorientationController.create)
    .put('/traiter/:id', DemandeReorientationController.traiter)
    .get('/:id', DemandeReorientationController.get)
    .put('/:id', DemandeReorientationController.update)

export default router
