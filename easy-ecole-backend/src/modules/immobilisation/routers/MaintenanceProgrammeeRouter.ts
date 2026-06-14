import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MaintenanceProgrammeeController from "../controllers/MaintenanceProgrammeeController";
const router = express.Router();
router
    .get('/', [Authenticate], MaintenanceProgrammeeController.getAll)
    .get('/:id', [Authenticate], MaintenanceProgrammeeController.get)
    .post('/', [Authenticate], MaintenanceProgrammeeController.create)
    .put('/:id', [Authenticate], MaintenanceProgrammeeController.update)
    .delete('/:id', [Authenticate], MaintenanceProgrammeeController.delete)
export default router;
