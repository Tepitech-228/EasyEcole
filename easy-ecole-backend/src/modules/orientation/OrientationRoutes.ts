require("./models/_associations")
import express from "express";
import ParcoursRouter from "./routers/ParcoursRouter"
import MatierePrerequisRouter from "./routers/MatierePrerequisRouter"
import NiveauEtudeRouter from "./routers/NiveauEtudeRouter"
import CategorieRouter from "./routers/CategorieRouter"
import DeboucheParcoursRouter from "./routers/DeboucheParcoursRouter"
import PrerequisParcoursRouter from "./routers/PrerequisParcoursRouter"
import ParcoursChoisiRouter from "./routers/ParcoursChoisiRouter"
import PrerequisParcoursChoisiRouter from "./routers/PrerequisParcoursChoisiRouter"
import PanierParcoursChoisiRouter from "./routers/PanierParcoursChoisiRouter"
import DemandeOrientationRouter from "./routers/DemandeOrientationRouter"
import ReponseOrientationRouter from "./routers/ReponseOrientationRouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/parcours', [Authenticate], ParcoursRouter)
    .use('/matieres', [Authenticate], MatierePrerequisRouter)
    .use('/niveauxEtude', [Authenticate], NiveauEtudeRouter)
    .use('/categories', [Authenticate], CategorieRouter)
    .use('/debouchesParcours', [Authenticate], DeboucheParcoursRouter)
    .use('/prerequisParcours', [Authenticate], PrerequisParcoursRouter)
    .use('/parcoursChoisis', [Authenticate], ParcoursChoisiRouter)
    .use('/prerequisParcoursChoisis', [Authenticate], PrerequisParcoursChoisiRouter)
    .use('/panierParcoursChoisis', [Authenticate], PanierParcoursChoisiRouter)
    .use('/demandesOrientation', [Authenticate], DemandeOrientationRouter)
    .use('/reponsesOrientation', [Authenticate], ReponseOrientationRouter)

export default router;