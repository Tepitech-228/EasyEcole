import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportRHController from "../controllers/RapportRHController";

const router = express.Router();

router
    .get('/effectifs', [Authenticate], RapportRHController.getEffectifs)
    .get('/paie', [Authenticate], RapportRHController.getPaie)
    .get('/formations', [Authenticate], RapportRHController.getFormations)
    .get('/evaluations', [Authenticate], RapportRHController.getEvaluations)

export default router;
