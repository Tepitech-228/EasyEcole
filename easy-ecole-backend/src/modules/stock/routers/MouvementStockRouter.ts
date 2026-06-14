import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MouvementStockController from "../controllers/MouvementStockController";

const router = express.Router();
router
    .get('/', [Authenticate], MouvementStockController.getAll)
    .get('/:id', [Authenticate], MouvementStockController.get)
    .post('/', [Authenticate], MouvementStockController.create)
    .put('/:id', [Authenticate], MouvementStockController.update)
    .delete('/:id', [Authenticate], MouvementStockController.delete)
export default router;
