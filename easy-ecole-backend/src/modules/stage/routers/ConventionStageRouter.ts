import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ConventionStageController from "../controllers/ConventionStageController";

const router = express.Router();
router
    .get('/', [Authenticate], ConventionStageController.getAll)
    .get('/:id', [Authenticate], ConventionStageController.get)
    .post('/', [Authenticate], ConventionStageController.create)
    .put('/:id', [Authenticate], ConventionStageController.update)
    .delete('/:id', [Authenticate], ConventionStageController.delete)
export default router;
