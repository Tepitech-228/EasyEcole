import express from "express"
import ModuleController from "../controllers/ModuleController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], ModuleController.getAll)
    .post('/', [Authenticate], ModuleController.create)
    .get('/:id', [Authenticate], ModuleController.get)
    .put('/:id', [Authenticate], ModuleController.update)
    .delete('/:id', [Authenticate], ModuleController.delete)

export default router
