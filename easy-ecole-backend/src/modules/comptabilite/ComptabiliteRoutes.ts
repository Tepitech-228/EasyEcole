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
import Authenticate from "../../core/middlewares/Authenticate"
import ComptabiliteDashboardController from "./controllers/ComptabiliteDashboardController"

const router = express.Router()

router
  .get('/dashboard', [Authenticate], ComptabiliteDashboardController.getDashboard)
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

export default router
