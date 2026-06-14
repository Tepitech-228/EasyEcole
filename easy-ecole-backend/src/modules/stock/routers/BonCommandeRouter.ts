import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import BonCommandeController from "../controllers/BonCommandeController";

const router = express.Router();
router
    .get('/', [Authenticate], BonCommandeController.getAll)
    .get('/:id', [Authenticate], BonCommandeController.get)
    .post('/', [Authenticate], BonCommandeController.create)
    .put('/:id', [Authenticate], BonCommandeController.update)
    .delete('/:id', [Authenticate], BonCommandeController.delete)
export default router;
