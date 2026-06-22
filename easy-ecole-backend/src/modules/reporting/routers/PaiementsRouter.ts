import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportPaiementsController from "../controllers/RapportPaiementsController";

const router = express.Router();

router
    .get('/', [Authenticate], RapportPaiementsController.getPaiements)
    .get('/factures', [Authenticate], RapportPaiementsController.getFactures)
    .get('/totaux', [Authenticate], RapportPaiementsController.getTotaux)

export default router;
