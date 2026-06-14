import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AmortissementController from "../controllers/AmortissementController";
const router = express.Router();
router
    .get('/', [Authenticate], AmortissementController.getAll)
    .get('/:id', [Authenticate], AmortissementController.get)
    .post('/', [Authenticate], AmortissementController.create)
    .put('/:id', [Authenticate], AmortissementController.update)
    .delete('/:id', [Authenticate], AmortissementController.delete)
export default router;
