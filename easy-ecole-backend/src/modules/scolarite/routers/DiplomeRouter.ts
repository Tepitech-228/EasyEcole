import express from "express"
import DiplomeController from "../controllers/DiplomeController"

const router = express.Router()

router
    .get('/', DiplomeController.getAll)
    .get('/genererNumero/:annee', DiplomeController.genererNumero)
    .get('/byCursus/:cursusId', DiplomeController.getByCursus)
    .post('/', DiplomeController.create)
    .get('/:id', DiplomeController.get)
    .put('/:id', DiplomeController.update)
    .delete('/:id', DiplomeController.delete)

export default router
