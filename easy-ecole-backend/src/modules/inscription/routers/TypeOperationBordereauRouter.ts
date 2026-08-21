import express from "express"
import TypeOperationBordereauController from "../controllers/TypeOperationBordereauController"
import Authenticate from "../../../core/middlewares/Authenticate"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

router
  .get('/', [Authenticate], TypeOperationBordereauController.getAll)
  .get('/actifs', [Authenticate], TypeOperationBordereauController.getActive)
  .get('/:id', [Authenticate], TypeOperationBordereauController.get)
  .post('/', [Authenticate, CheckPermission('action.finance.typeOperation.creer')], TypeOperationBordereauController.create)
  .put('/:id', [Authenticate, CheckPermission('action.finance.typeOperation.modifier')], TypeOperationBordereauController.update)
  .delete('/:id', [Authenticate, CheckPermission('action.finance.typeOperation.supprimer')], TypeOperationBordereauController.delete)

export default router
