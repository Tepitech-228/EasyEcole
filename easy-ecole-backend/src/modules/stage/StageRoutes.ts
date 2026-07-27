require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import { InscriptionComplete } from "../../core/middlewares/InscriptionComplete";
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
    .use('/entreprises', [Authenticate, InscriptionComplete], EntrepriseRouter)
    .use('/tuteurs', [Authenticate, InscriptionComplete], TuteurRouter)
    .use('/offres', [Authenticate, InscriptionComplete], OffreStageRouter)
    .use('/demandes', [Authenticate, InscriptionComplete], DemandeStageRouter)
    .use('/conventions', [Authenticate, InscriptionComplete], ConventionStageRouter)
    .use('/rapports', [Authenticate, InscriptionComplete], RapportStageRouter)
    .use('/notes', [Authenticate, InscriptionComplete], NoteStageRouter)
    .use('/attestations', [Authenticate, InscriptionComplete], AttestationStageRouter)

export default router;
