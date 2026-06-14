import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import DemandeStageController from "../controllers/DemandeStageController";

const router = express.Router();
router
    .get('/', [Authenticate], DemandeStageController.getAll)
    .get('/:id', [Authenticate], DemandeStageController.get)
    .post('/', [Authenticate], DemandeStageController.create)
    .put('/valider/:id', [Authenticate], DemandeStageController.valider)
    .put('/rejeter/:id', [Authenticate], DemandeStageController.rejeter)
export default router;
