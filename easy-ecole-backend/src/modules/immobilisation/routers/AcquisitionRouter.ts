import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AcquisitionController from "../controllers/AcquisitionController";
const router = express.Router();
router
    .get('/', [Authenticate], AcquisitionController.getAll)
    .get('/:id', [Authenticate], AcquisitionController.get)
    .post('/', [Authenticate], AcquisitionController.create)
    .put('/:id', [Authenticate], AcquisitionController.update)
    .delete('/:id', [Authenticate], AcquisitionController.delete)
export default router;
