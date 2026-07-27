import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LigneInventaireStockController from "../controllers/LigneInventaireStockController";
const router = express.Router();
router
    .get('/', [Authenticate], LigneInventaireStockController.getAll)
    .get('/:id', [Authenticate], LigneInventaireStockController.get)
    .post('/', [Authenticate], LigneInventaireStockController.create)
    .put('/:id', [Authenticate], LigneInventaireStockController.update)
    .delete('/:id', [Authenticate], LigneInventaireStockController.delete)
    .get('/by-inventaire/:inventaireId', [Authenticate], LigneInventaireStockController.getByInventaire)
export default router;
