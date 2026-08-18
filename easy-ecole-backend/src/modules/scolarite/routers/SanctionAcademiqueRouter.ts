import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import SanctionAcademiqueController from "../controllers/SanctionAcademiqueController"

const router = express.Router()

// Proteger - donnees academiques sensibles
router.use([Authenticate]);

router
    .get('/', SanctionAcademiqueController.getAll)
    .get('/actives', SanctionAcademiqueController.getActives)
    .post('/', SanctionAcademiqueController.create)
    .get('/byCursus/:cursusId', SanctionAcademiqueController.getByCursus)
    .get('/:id', SanctionAcademiqueController.get)
    .put('/:id', SanctionAcademiqueController.update)
    .delete('/:id', SanctionAcademiqueController.delete)

export default router
