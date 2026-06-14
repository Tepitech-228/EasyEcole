import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import FournisseurController from "../controllers/FournisseurController";

const router = express.Router();
router
    .get('/', [Authenticate], FournisseurController.getAll)
    .get('/:id', [Authenticate], FournisseurController.get)
    .post('/', [Authenticate], FournisseurController.create)
    .put('/:id', [Authenticate], FournisseurController.update)
    .delete('/:id', [Authenticate], FournisseurController.delete)
export default router;
