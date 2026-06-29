require("./models/_associations")
import express from "express";
import DemandeDocumentRouter from "./routers/DemandeDocumentRouter"
import DocumentDelivreRouter from "./routers/DocumentDelivreRouter"
import ReclamationRouter from "./routers/ReclamationRouter"
import RegistreAcademiqueRouter from "./routers/RegistreAcademiqueRouter"
import EvenementCalendrierRouter from "./routers/EvenementCalendrierRouter"
import SanctionDisciplineRouter from "./routers/SanctionDisciplineRouter"
import ConseilClasseRouter from "./routers/ConseilClasseRouter"
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

export default router;
