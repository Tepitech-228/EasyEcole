import express from "express"
import RhRemboursementPretController from "../controllers/RhRemboursementPretController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate], RhRemboursementPretController.getAll)
  .get('/by-pret/:pretId', [Authenticate], RhRemboursementPretController.getByPret)
  .get('/:id', [Authenticate], RhRemboursementPretController.get)
  .post('/', [Authenticate], RhRemboursementPretController.effectuerRemboursement)
  .put('/:id', [Authenticate], RhRemboursementPretController.update)
  .delete('/:id', [Authenticate], RhRemboursementPretController.delete)

export default router
