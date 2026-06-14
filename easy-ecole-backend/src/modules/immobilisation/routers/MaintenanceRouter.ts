import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MaintenanceController from "../controllers/MaintenanceController";
const router = express.Router();
router
    .get('/', [Authenticate], MaintenanceController.getAll)
    .get('/:id', [Authenticate], MaintenanceController.get)
    .post('/', [Authenticate], MaintenanceController.create)
    .put('/:id', [Authenticate], MaintenanceController.update)
    .delete('/:id', [Authenticate], MaintenanceController.delete)
export default router;
