import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportAchatsController from "../controllers/RapportAchatsController";

const router = express.Router();

router
    .get('/', [Authenticate], RapportAchatsController.getAchats)
    .get('/stocks', [Authenticate], RapportAchatsController.getStocks)
    .get('/immobilisations', [Authenticate], RapportAchatsController.getImmobilisations)

export default router;
