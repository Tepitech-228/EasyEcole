import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportStageController from "../controllers/RapportStageController";

const router = express.Router();
router
    .get('/', [Authenticate], RapportStageController.getAll)
    .get('/:id', [Authenticate], RapportStageController.get)
    .post('/', [Authenticate], RapportStageController.create)
    .put('/:id', [Authenticate], RapportStageController.update)
    .delete('/:id', [Authenticate], RapportStageController.delete)
export default router;
