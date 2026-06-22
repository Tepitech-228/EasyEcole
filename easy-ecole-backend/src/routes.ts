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
const router = express.Router();

router
    .get('', async (req: Request, res: Response) => {
        res.send("Hello world");
    })
    .use('/auth', AuthRoutes)
    .use('/orientation', OrientationRoutes)
    .use('/inscription', InscriptionRoutes)
    .use('/stages', StageRoutes)
    .use('/stocks', StockRoutes)
    .use('/immobilisations', ImmobilisationRoutes)
    .use('/elearning', ElearningRoutes)
    .use('/reporting', ReportingRoutes)
    .use('/achats', AchatsRoutes)
    .use('/rh', RhRoutes)
    .use('/communication', CommunicationRoutes)
    .use('/scolarite', ScolariteRoutes)

    // Not found
    .use('*', (req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée'
        });
    })

export default router;