import express, { Request, Response } from "express";
import AuthRoutes from "./modules/auth/AuthRoutes";
import OrientationRoutes from "./modules/orientation/OrientationRoutes";
import InscriptionRoutes from "./modules/inscription/InscriptionRoutes";
import StageRoutes from "./modules/stage/StageRoutes";
import StockRoutes from "./modules/stock/StockRoutes";
import ImmobilisationRoutes from "./modules/immobilisation/ImmobilisationRoutes";
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

    // Not found
    .use('*', (req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée'
        });
    })

export default router;