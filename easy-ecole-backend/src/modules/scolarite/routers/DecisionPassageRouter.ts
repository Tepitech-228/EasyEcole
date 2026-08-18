import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import DecisionPassageController from "../controllers/DecisionPassageController"

const router = express.Router()

// Proteger toutes les routes - donnees academiques sensibles
router.use([Authenticate]);

router
    .get('/', DecisionPassageController.getAll)
    .post('/', DecisionPassageController.create)
    .get('/byCursus/:cursusId', DecisionPassageController.getByCursus)
    .get('/byAnnee/:anneeId', DecisionPassageController.getByAnnee)
    .get('/:id', DecisionPassageController.get)
    .put('/:id', DecisionPassageController.update)
    .delete('/:id', DecisionPassageController.delete)

export default router
