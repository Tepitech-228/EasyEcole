import express from "express"
import RhIndemnitePrestataireController from "../controllers/RhIndemnitePrestataireController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
    .get('/', [Authenticate], RhIndemnitePrestataireController.getAll)
    .get('/by-prestataire/:prestataireId', [Authenticate], RhIndemnitePrestataireController.getByPrestataire)
    .get('/:id', [Authenticate], RhIndemnitePrestataireController.get)
    .post('/', [Authenticate], RhIndemnitePrestataireController.create)
    .put('/:id', [Authenticate], RhIndemnitePrestataireController.update)
    .delete('/:id', [Authenticate], RhIndemnitePrestataireController.delete)

export default router
