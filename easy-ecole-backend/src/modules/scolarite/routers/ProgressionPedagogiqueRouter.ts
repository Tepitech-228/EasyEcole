import express from "express"
import ProgressionPedagogiqueController from "../controllers/ProgressionPedagogiqueController"

const router = express.Router()

router
    .get('/', ProgressionPedagogiqueController.getAll)
    .get('/cours/:coursId', ProgressionPedagogiqueController.getByCours)
    .get('/:id', ProgressionPedagogiqueController.get)
    .post('/', ProgressionPedagogiqueController.create)
    .put('/:id', ProgressionPedagogiqueController.update)
    .delete('/:id', ProgressionPedagogiqueController.delete)

export default router