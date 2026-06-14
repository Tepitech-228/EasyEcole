import express, { Request, Response } from "express";
import AuthRoutes from "./modules/auth/AuthRoutes";
import OrientationRoutes from "./modules/orientation/OrientationRoutes";
import InscriptionRoutes from "./modules/inscription/InscriptionRoutes";

const router = express.Router();

router
    .get('', async (req: Request, res: Response) => {
        res.send("Hello world");
    })
    .use('/auth', AuthRoutes)
    .use('/orientation', OrientationRoutes)
    .use('/inscription', InscriptionRoutes)

    // Not found
    .use('*', (req: Request, res: Response) => {
        return res.status(404).json({
            success: false,
            message: 'Ressource non trouvée'
        });
    })

export default router;