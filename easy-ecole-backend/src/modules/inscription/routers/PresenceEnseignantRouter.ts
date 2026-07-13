import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import PresenceEnseignantController from "../controllers/PresenceEnseignantController"

const router = express.Router()
const controller = new PresenceEnseignantController()

router.get('/seances/:seanceId/presences', [Authenticate], controller.getPresencesParSeanceV2.bind(controller))
router.post('/seances/:seanceId/generer-presences', [AuthEnseignant], controller.genererPresencesPourSeance.bind(controller))
router.put('/presences-cours-participants/:id', [AuthEnseignant], controller.mettreAJourEtatPresence.bind(controller))
router.post('/presences-cours-participants/massive', [AuthEnseignant], controller.mettreAJourMassive.bind(controller))

export default router
