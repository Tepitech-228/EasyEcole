import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import BatimentController from "../controllers/BatimentController";
const router = express.Router();
router
    .get('/', [Authenticate], BatimentController.getAll)
    .get('/:id', [Authenticate], BatimentController.get)
    .post('/', [Authenticate], BatimentController.create)
    .put('/:id', [Authenticate], BatimentController.update)
    .delete('/:id', [Authenticate], BatimentController.delete)
export default router;
