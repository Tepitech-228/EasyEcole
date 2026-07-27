import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ReportingController from "../controllers/ReportingController";
const router = express.Router();
router
    .get('/stats', [Authenticate], ReportingController.getStats)
    .get('/fiche/:id', [Authenticate], ReportingController.getFicheImmobilisation)
    .get('/amortissements-previsionnels', [Authenticate], ReportingController.getAmortissementsPrevisionnels)
    .get('/echeances-assurances', [Authenticate], ReportingController.getEcheancesAssurances)
    .get('/sorties-en-cours', [Authenticate], ReportingController.getSortiesEnCours)
export default router;
