import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import InventaireStockController from "../controllers/InventaireStockController";
const router = express.Router();
router
    .get('/', [Authenticate], InventaireStockController.getAll)
    .get('/:id', [Authenticate], InventaireStockController.get)
    .post('/', [Authenticate], InventaireStockController.create)
    .put('/:id', [Authenticate], InventaireStockController.update)
    .delete('/:id', [Authenticate], InventaireStockController.delete)
    .patch('/:id/cloture', [Authenticate], InventaireStockController.cloture)
    .get('/:id/lignes', [Authenticate], InventaireStockController.getWithLignes)
export default router;
