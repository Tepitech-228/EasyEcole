import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CessionController from "../controllers/CessionController";
const router = express.Router();
router
    .get('/', [Authenticate], CessionController.getAll)
    .get('/:id', [Authenticate], CessionController.get)
    .post('/', [Authenticate], CessionController.create)
    .put('/:id', [Authenticate], CessionController.update)
    .delete('/:id', [Authenticate], CessionController.delete)
    .patch('/:id/approuver', [Authenticate], CessionController.approuver)
    .patch('/:id/refuser', [Authenticate], CessionController.refuser)
export default router;
