import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import OffreStageController from "../controllers/OffreStageController";

const router = express.Router();
router
    .get('/', [Authenticate], OffreStageController.getAll)
    .get('/:id', [Authenticate], OffreStageController.get)
    .post('/', [Authenticate], OffreStageController.create)
    .put('/:id', [Authenticate], OffreStageController.update)
    .delete('/:id', [Authenticate], OffreStageController.delete)
export default router;
