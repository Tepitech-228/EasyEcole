import express from "express"
import TransfertStockController from "../controllers/TransfertStockController"

const router = express.Router()

router
    .get('/', TransfertStockController.getAll)
    .post('/', TransfertStockController.create)
    .get('/:id', TransfertStockController.get)
    .post('/:id/annuler', TransfertStockController.annuler)

export default router
