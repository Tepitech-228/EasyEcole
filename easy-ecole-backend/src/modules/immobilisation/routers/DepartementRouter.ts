import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import DepartementController from "../controllers/DepartementController";
const router = express.Router();
router
    .get('/', [Authenticate], DepartementController.getAll)
    .get('/:id', [Authenticate], DepartementController.get)
    .post('/', [Authenticate], DepartementController.create)
    .put('/:id', [Authenticate], DepartementController.update)
    .delete('/:id', [Authenticate], DepartementController.delete)
export default router;
