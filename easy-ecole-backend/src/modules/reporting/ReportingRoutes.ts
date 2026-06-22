require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import EffectifsRouter from "./routers/EffectifsRouter"
import NotesRouter from "./routers/NotesRouter"
import PaiementsRouter from "./routers/PaiementsRouter"
import BudgetRouter from "./routers/BudgetRouter"
import RHRouter from "./routers/RHRouter"
import AchatsRouter from "./routers/AchatsRouter"
import ConsolideRouter from "./routers/ConsolideRouter"

const router = express.Router();

router
    .use('/effectifs', [Authenticate], EffectifsRouter)
    .use('/notes', [Authenticate], NotesRouter)
    .use('/paiements', [Authenticate], PaiementsRouter)
    .use('/budget', [Authenticate], BudgetRouter)
    .use('/rh', [Authenticate], RHRouter)
    .use('/achats', [Authenticate], AchatsRouter)
    .use('/consolide', [Authenticate], ConsolideRouter)

export default router;
