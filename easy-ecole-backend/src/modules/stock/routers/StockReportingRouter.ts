import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import StockReportingController from "../controllers/StockReportingController";

const router = express.Router();

router
    .get('/stats', [Authenticate], StockReportingController.getStats)
    .get('/mouvements-recents', [Authenticate], StockReportingController.getMouvementsRecents)
    .get('/articles-alerte', [Authenticate], StockReportingController.getArticlesAlerte)
    .get('/valeur-stock', [Authenticate], StockReportingController.getValeurStock)
    .get('/synthese-mensuelle', [Authenticate], StockReportingController.getSyntheseMensuelle)

export default router;
