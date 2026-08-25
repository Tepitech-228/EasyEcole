import express, { Request, Response } from "express";
import AuthRoutes from "./modules/auth/AuthRoutes";
import OrientationRoutes from "./modules/orientation/OrientationRoutes";
import InscriptionRoutes from "./modules/inscription/InscriptionRoutes";
import StageRoutes from "./modules/stage/StageRoutes";
import StockRoutes from "./modules/stock/StockRoutes";
import ImmobilisationRoutes from "./modules/immobilisation/ImmobilisationRoutes";
import ElearningRoutes from "./modules/elearning/ElearningRoutes";
import ReportingRoutes from "./modules/reporting/ReportingRoutes";
import AchatsRoutes from "./modules/achats/AchatsRoutes";
import RhRoutes from "./modules/rh/RhRoutes";
import CommunicationRoutes from "./modules/communication/CommunicationRoutes";
import ScolariteRoutes from "./modules/scolarite/ScolariteRoutes";
import ComptabiliteRoutes from "./modules/comptabilite/ComptabiliteRoutes";
import GedRoutes from "./modules/ged/GedRoutes";
import MarcheRoutes from "./modules/marche/MarcheRoutes";
import SseRouter from "./modules/elearning/routers/SseRouter";
import MenuRoutes from "./modules/menu/MenuRoutes";
import ParentRoutes from "./modules/parent/ParentRoutes";
import EtablissementRoutes from "./modules/etablissement/EtablissementRoutes";
import DocGenRoutes from "./modules/docgen/DocGenRoutes";
import QualiteRoutes from "./modules/qualite/QualiteRoutes";
import BourseRoutes from "./modules/bourse/BourseRoutes";
import VerificationController from "./modules/docgen/controllers/VerificationController";
import PublicationNoteRouter from "./modules/inscription/routers/PublicationNoteRouter";
const router = express.Router();

router
    .get('', async (req: Request, res: Response) => {
        res.send("Hello world");
    })
    .use('/auth', AuthRoutes)
    .use('/orientation', OrientationRoutes)
    .use('/inscription', InscriptionRoutes)
    .use('/publications-notes', PublicationNoteRouter)
    .use('/stages', StageRoutes)
    .use('/stocks', StockRoutes)
    .use('/immobilisations', ImmobilisationRoutes)
    .use('/elearning', ElearningRoutes)
    .use('/events', SseRouter)
    .use('/reporting', ReportingRoutes)
    .use('/marche', MarcheRoutes)
    .use('/achats', AchatsRoutes)
    .use('/rh', RhRoutes)
    .use('/communication', CommunicationRoutes)
    .use('/scolarite', ScolariteRoutes)
    .use('/ged', GedRoutes)
    .use('/comptabilite', ComptabiliteRoutes)
    .use('/menu', MenuRoutes)
    .use('/parent', ParentRoutes)
    .use('/etablissements', EtablissementRoutes)
    .use('/qualite', QualiteRoutes)
    .use('/docgen', DocGenRoutes)
    .use('/bourses', BourseRoutes)
    .get('/verification/document/:matricule/:reference', VerificationController.verifier)

    // Not found
    .use('*', (req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée'
        });
    })

export default router;
