import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LigneBonCommandeController from "../controllers/LigneBonCommandeController";

const router = express.Router();
router
    .get('/', [Authenticate], LigneBonCommandeController.getAll)
    .get('/:id', [Authenticate], LigneBonCommandeController.get)
    .post('/', [Authenticate], LigneBonCommandeController.create)
    .put('/:id', [Authenticate], LigneBonCommandeController.update)
    .delete('/:id', [Authenticate], LigneBonCommandeController.delete)
export default router;
