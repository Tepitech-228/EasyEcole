require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import EntrepriseRouter from "./routers/EntrepriseRouter"
import TuteurRouter from "./routers/TuteurRouter"
import OffreStageRouter from "./routers/OffreStageRouter"
import DemandeStageRouter from "./routers/DemandeStageRouter"
import ConventionStageRouter from "./routers/ConventionStageRouter"
import RapportStageRouter from "./routers/RapportStageRouter"
import NoteStageRouter from "./routers/NoteStageRouter"
import AttestationStageRouter from "./routers/AttestationStageRouter"

const router = express.Router();

router
    .use('/entreprises', [Authenticate], EntrepriseRouter)
    .use('/tuteurs', [Authenticate], TuteurRouter)
    .use('/offres', [Authenticate], OffreStageRouter)
    .use('/demandes', [Authenticate], DemandeStageRouter)
    .use('/conventions', [Authenticate], ConventionStageRouter)
    .use('/rapports', [Authenticate], RapportStageRouter)
    .use('/notes', [Authenticate], NoteStageRouter)
    .use('/attestations', [Authenticate], AttestationStageRouter)

export default router;
