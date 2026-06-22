import express from "express"
import CoursEnLigneController from "../controllers/CoursEnLigneController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], CoursEnLigneController.getAll)
    .post('/', [Authenticate], CoursEnLigneController.create)
    .get('/:id', [Authenticate], CoursEnLigneController.get)
    .put('/:id', [Authenticate], CoursEnLigneController.update)
    .delete('/:id', [Authenticate], CoursEnLigneController.delete)

export default router
