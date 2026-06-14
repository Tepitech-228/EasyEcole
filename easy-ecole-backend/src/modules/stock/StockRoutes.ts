require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import CategorieArticleRouter from "./routers/CategorieArticleRouter"
import FournisseurRouter from "./routers/FournisseurRouter"
import ArticleRouter from "./routers/ArticleRouter"
import MouvementStockRouter from "./routers/MouvementStockRouter"
import BonCommandeRouter from "./routers/BonCommandeRouter"
import LigneBonCommandeRouter from "./routers/LigneBonCommandeRouter"

const router = express.Router();

router
    .use('/categories', [Authenticate], CategorieArticleRouter)
    .use('/fournisseurs', [Authenticate], FournisseurRouter)
    .use('/articles', [Authenticate], ArticleRouter)
    .use('/mouvements', [Authenticate], MouvementStockRouter)
    .use('/commandes', [Authenticate], BonCommandeRouter)
    .use('/lignes-commande', [Authenticate], LigneBonCommandeRouter)

export default router;
