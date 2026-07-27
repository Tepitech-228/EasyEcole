import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import InventaireController from "../controllers/InventaireController";
const router = express.Router();
router
    .get('/', [Authenticate], InventaireController.getAll)
    .get('/:id', [Authenticate], InventaireController.get)
    .get('/:id/lignes', [Authenticate], InventaireController.getWithLignes)
    .post('/', [Authenticate], InventaireController.create)
    .put('/:id', [Authenticate], InventaireController.update)
    .patch('/:id/cloture', [Authenticate], InventaireController.cloture)
    .delete('/:id', [Authenticate], InventaireController.delete)
export default router;
