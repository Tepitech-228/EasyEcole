import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AttestationStageController from "../controllers/AttestationStageController";

const router = express.Router();
router
    .get('/', [Authenticate], AttestationStageController.getAll)
    .get('/:id', [Authenticate], AttestationStageController.get)
    .post('/', [Authenticate], AttestationStageController.create)
    .put('/:id', [Authenticate], AttestationStageController.update)
    .delete('/:id', [Authenticate], AttestationStageController.delete)
export default router;
