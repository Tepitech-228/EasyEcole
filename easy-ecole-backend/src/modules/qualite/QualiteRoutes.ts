require("./models/_associations")
import express from "express";
import QuaNonConformiteRouter from "./routers/QuaNonConformiteRouter"
import QuaActionCorrectiveRouter from "./routers/QuaActionCorrectiveRouter"
import QuaAuditRouter from "./routers/QuaAuditRouter"
import QuaAuditPisteRouter from "./routers/QuaAuditPisteRouter"
import QuaRevueDirectionRouter from "./routers/QuaRevueDirectionRouter"
import QuaDecisionRevueRouter from "./routers/QuaDecisionRevueRouter"
import QuaEnqueteSatisfactionRouter from "./routers/QuaEnqueteSatisfactionRouter"
import QuaReponseSatisfactionRouter from "./routers/QuaReponseSatisfactionRouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/non-conformites', [Authenticate], QuaNonConformiteRouter)
    .use('/actions-correctives', [Authenticate], QuaActionCorrectiveRouter)
    .use('/audits', [Authenticate], QuaAuditRouter)
    .use('/audits-pistes', [Authenticate], QuaAuditPisteRouter)
    .use('/revues-direction', [Authenticate], QuaRevueDirectionRouter)
    .use('/decisions-revue', [Authenticate], QuaDecisionRevueRouter)
    .use('/enquetes-satisfaction', [Authenticate], QuaEnqueteSatisfactionRouter)
    .use('/reponses-satisfaction', [Authenticate], QuaReponseSatisfactionRouter)

export default router
