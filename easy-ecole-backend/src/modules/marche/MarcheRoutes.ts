require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import PlanificationMarcheRouter from "./routers/PlanificationMarcheRouter"
import ManifestationInteretRouter from "./routers/ManifestationInteretRouter"
import AppelOffreRouter from "./routers/AppelOffreRouter"
import ContratMarcheRouter from "./routers/ContratMarcheRouter"
import AvenantMarcheRouter from "./routers/AvenantMarcheRouter"

const router = express.Router();

router
    .use('/planifications', [Authenticate], PlanificationMarcheRouter)
    .use('/ami', [Authenticate], ManifestationInteretRouter)
    .use('/ao', [Authenticate], AppelOffreRouter)
    .use('/contrats', [Authenticate], ContratMarcheRouter)
    .use('/avenants', [Authenticate], AvenantMarcheRouter)

export default router;
