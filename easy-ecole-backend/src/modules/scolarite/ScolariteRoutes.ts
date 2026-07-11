require("./models/_associations")
import express from "express";
import DemandeDocumentRouter from "./routers/DemandeDocumentRouter"
import DocumentDelivreRouter from "./routers/DocumentDelivreRouter"
import ReclamationRouter from "./routers/ReclamationRouter"
import RegistreAcademiqueRouter from "./routers/RegistreAcademiqueRouter"
import EvenementCalendrierRouter from "./routers/EvenementCalendrierRouter"
import SanctionDisciplineRouter from "./routers/SanctionDisciplineRouter"
import ConseilClasseRouter from "./routers/ConseilClasseRouter"
import LivreRouter from "./routers/LivreRouter"
import DecisionPassageRouter from "./routers/DecisionPassageRouter"
import DemandeReorientationRouter from "./routers/DemandeReorientationRouter"
import SanctionAcademiqueRouter from "./routers/SanctionAcademiqueRouter"
import DiplomeRouter from "./routers/DiplomeRouter"
import DemandeVAERouter from "./routers/DemandeVAERouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/demandesDocument', [Authenticate], DemandeDocumentRouter)
    .use('/typesDocument', [Authenticate], DocumentDelivreRouter)
    .use('/reclamations', [Authenticate], ReclamationRouter)
    .use('/registres', [Authenticate], RegistreAcademiqueRouter)
    .use('/calendrier', [Authenticate], EvenementCalendrierRouter)
    .use('/discipline', [Authenticate], SanctionDisciplineRouter)
    .use('/conseils', [Authenticate], ConseilClasseRouter)
    .use('/bibliotheque', [Authenticate], LivreRouter)
    .use('/decisions-passage', [Authenticate], DecisionPassageRouter)
    .use('/reorientations', [Authenticate], DemandeReorientationRouter)
    .use('/sanctions', [Authenticate], SanctionAcademiqueRouter)
    .use('/diplomes', [Authenticate], DiplomeRouter)
    .use('/demandes-vae', [Authenticate], DemandeVAERouter)

export default router;
