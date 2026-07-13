import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import AutoSanctionController from "../controllers/AutoSanctionController"

const router = express.Router()
const controller = new AutoSanctionController()

router.post('/sanctions-auto/declencher', [AuthInstitution], controller.declencher.bind(controller))
router.post('/sanctions-auto/verifier/:cursusApprenantId', [Authenticate], controller.verifierEtudiant.bind(controller))
router.get('/sanctions-auto/etudiant/:cursusApprenantId', [Authenticate], controller.getSanctionsParEtudiant.bind(controller))

export default router
