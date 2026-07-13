require("./models/_associations")
import express from "express"
import CompteRouter from "./routers/CompteRouter"
import EcritureComptableRouter from "./routers/EcritureComptableRouter"
import JournalComptableRouter from "./routers/JournalComptableRouter"
import Authenticate from "../../core/middlewares/Authenticate"

const router = express.Router()

router
  .use('/comptes', [Authenticate], CompteRouter)
  .use('/journaux', [Authenticate], JournalComptableRouter)
  .use('/ecritures', [Authenticate], EcritureComptableRouter)

export default router
