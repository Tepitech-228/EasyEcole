import express from "express"
import SanctionAcademiqueController from "../controllers/SanctionAcademiqueController"

const router = express.Router()

router
    .get('/', SanctionAcademiqueController.getAll)
    .get('/actives', SanctionAcademiqueController.getActives)
    .post('/', SanctionAcademiqueController.create)
    .get('/byCursus/:cursusId', SanctionAcademiqueController.getByCursus)
    .get('/:id', SanctionAcademiqueController.get)
    .put('/:id', SanctionAcademiqueController.update)
    .delete('/:id', SanctionAcademiqueController.delete)

export default router
