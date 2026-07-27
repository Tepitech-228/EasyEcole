import express from "express"
import RhPrestataireController from "../controllers/RhPrestataireController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], RhPrestataireController.getAll)
    .get('/:id', [Authenticate], RhPrestataireController.get)
    .post('/', [Authenticate], RhPrestataireController.create)
    .put('/:id', [Authenticate], RhPrestataireController.update)
    .delete('/:id', [Authenticate], RhPrestataireController.delete)

export default router
