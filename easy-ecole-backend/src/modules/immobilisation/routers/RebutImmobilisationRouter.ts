import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate";
import RebutImmobilisationController from "../controllers/RebutImmobilisationController"

const router = express.Router()

router
    .get('/', [Authenticate], RebutImmobilisationController.getAll)
    .post('/', [Authenticate], RebutImmobilisationController.create)
    .get('/:id', [Authenticate], RebutImmobilisationController.get)
    .put('/:id', [Authenticate], RebutImmobilisationController.update)
    .delete('/:id', [Authenticate], RebutImmobilisationController.delete)

export default router
