require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import DemandeRouter from "./routers/DemandeRouter"
import ValidationRouter from "./routers/ValidationRouter"
import ValidateurRouter from "./routers/ValidateurRouter"
import CommandeRouter from "./routers/CommandeRouter"
import ReceptionRouter from "./routers/ReceptionRouter"
import FactureRouter from "./routers/FactureRouter"
import BudgetRouter from "./routers/BudgetRouter"
import EngagementRouter from "./routers/EngagementRouter"
import FournisseurRouter from "./routers/FournisseurRouter"
import CategorieAchatRouter from "./routers/CategorieAchatRouter"

const router = express.Router();

router
    .use('/demandes', [Authenticate], DemandeRouter)
    .use('/validations', [Authenticate], ValidationRouter)
    .use('/validateurs', [Authenticate], ValidateurRouter)
    .use('/commandes', [Authenticate], CommandeRouter)
    .use('/receptions', [Authenticate], ReceptionRouter)
    .use('/factures', [Authenticate], FactureRouter)
    .use('/budgets', [Authenticate], BudgetRouter)
    .use('/engagements', [Authenticate], EngagementRouter)
    .use('/fournisseurs', [Authenticate], FournisseurRouter)
    .use('/categories', [Authenticate], CategorieAchatRouter)

export default router;
