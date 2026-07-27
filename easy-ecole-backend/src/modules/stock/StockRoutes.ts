require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import CategorieArticleRouter from "./routers/CategorieArticleRouter"
import FournisseurRouter from "./routers/FournisseurRouter"
import ArticleRouter from "./routers/ArticleRouter"
import MouvementStockRouter from "./routers/MouvementStockRouter"
import BonCommandeRouter from "./routers/BonCommandeRouter"
import LigneBonCommandeRouter from "./routers/LigneBonCommandeRouter"
import BesoinRouter from "./routers/BesoinRouter"
import DemandePrixRouter from "./routers/DemandePrixRouter"
import RebutRouter from "./routers/RebutRouter"
import CorrectionStockRouter from "./routers/CorrectionStockRouter"
import InventaireStockRouter from "./routers/InventaireStockRouter"
import LigneInventaireStockRouter from "./routers/LigneInventaireStockRouter"
import StockReportingRouter from "./routers/StockReportingRouter"
import TransfertStockRouter from "./routers/TransfertStockRouter"

const router = express.Router();

router
    .use('/categories', [Authenticate], CategorieArticleRouter)
    .use('/fournisseurs', [Authenticate], FournisseurRouter)
    .use('/articles', [Authenticate], ArticleRouter)
    .use('/mouvements', [Authenticate], MouvementStockRouter)
    .use('/commandes', [Authenticate], BonCommandeRouter)
    .use('/lignes-commande', [Authenticate], LigneBonCommandeRouter)
    .use('/besoins', [Authenticate], BesoinRouter)
    .use('/demandes-prix', [Authenticate], DemandePrixRouter)
    .use('/rebuts', [Authenticate], RebutRouter)
    .use('/corrections-stock', [Authenticate], CorrectionStockRouter)
    .use('/inventaires', [Authenticate], InventaireStockRouter)
    .use('/lignes-inventaire', [Authenticate], LigneInventaireStockRouter)
    .use('/reportings', [Authenticate], StockReportingRouter)
    .use('/transferts', [Authenticate], TransfertStockRouter)

export default router;
