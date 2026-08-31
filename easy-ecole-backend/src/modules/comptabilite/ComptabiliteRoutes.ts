require("./models/_associations")
import express from "express"
import CompteRouter from "./routers/CompteRouter"
import EcritureComptableRouter from "./routers/EcritureComptableRouter"
import JournalComptableRouter from "./routers/JournalComptableRouter"
import FraisParcoursRouter from "./routers/FraisParcoursRouter"
import LigneFraisEtudiantRouter from "./routers/LigneFraisEtudiantRouter"
import ReductionFraisRouter from "./routers/ReductionFraisRouter"
import PenaliteRetardRouter from "./routers/PenaliteRetardRouter"
import CompteBancaireRouter from "./routers/CompteBancaireRouter"
import ReleveBancaireRouter from "./routers/ReleveBancaireRouter"
import RapprochementRouter from "./routers/RapprochementRouter"
import ExerciceComptableRouter from "./routers/ExerciceComptableRouter"
import EtatsFinanciersRouter from "./routers/EtatsFinanciersRouter"
import ParametreFraisRouter from "./routers/ParametreFraisRouter"
import Authenticate from "../../core/middlewares/Authenticate"
import { cache } from "../../core/middlewares/CacheMiddleware"
import ComptabiliteDashboardController from "./controllers/ComptabiliteDashboardController"

const router = express.Router()

router
  // Lecture agrégée coûteuse → cache Redis 30 s (clé par utilisateur)
  .get('/dashboard', [Authenticate, cache(30)], ComptabiliteDashboardController.getDashboard)
  .use('/comptes', [Authenticate], CompteRouter)
  .use('/journaux', [Authenticate], JournalComptableRouter)
  .use('/ecritures', [Authenticate], EcritureComptableRouter)
  .use('/frais-parcours', [Authenticate], FraisParcoursRouter)
  .use('/lignes-frais', [Authenticate], LigneFraisEtudiantRouter)
  .use('/reductions', [Authenticate], ReductionFraisRouter)
  .use('/penalites', [Authenticate], PenaliteRetardRouter)
  .use('/comptes-bancaires', [Authenticate], CompteBancaireRouter)
  .use('/releves-bancaires', [Authenticate], ReleveBancaireRouter)
  .use('/rapprochement', [Authenticate], RapprochementRouter)
  .use('/exercices', [Authenticate], ExerciceComptableRouter)
  .use('/etats-financiers', [Authenticate], EtatsFinanciersRouter)
  .use('/parametres-frais', [Authenticate], ParametreFraisRouter)

export default router
