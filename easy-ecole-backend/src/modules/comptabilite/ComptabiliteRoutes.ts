require("./models/_associations")
import express from "express"
import CompteRouter from "./routers/CompteRouter"
import EcritureComptableRouter from "./routers/EcritureComptableRouter"
import JournalComptableRouter from "./routers/JournalComptableRouter"
import FraisParcoursRouter from "./routers/FraisParcoursRouter"
import LigneFraisEtudiantRouter from "./routers/LigneFraisEtudiantRouter"
import ReductionFraisRouter from "./routers/ReductionFraisRouter"
import PenaliteRetardRouter from "./routers/PenaliteRetardRouter"
import Authenticate from "../../core/middlewares/Authenticate"

const router = express.Router()

router
  .use('/comptes', [Authenticate], CompteRouter)
  .use('/journaux', [Authenticate], JournalComptableRouter)
  .use('/ecritures', [Authenticate], EcritureComptableRouter)
  .use('/frais-parcours', [Authenticate], FraisParcoursRouter)
  .use('/lignes-frais', [Authenticate], LigneFraisEtudiantRouter)
  .use('/reductions', [Authenticate], ReductionFraisRouter)
  .use('/penalites', [Authenticate], PenaliteRetardRouter)

export default router
