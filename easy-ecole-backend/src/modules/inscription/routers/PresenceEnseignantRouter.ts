import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import { RefuserRoles } from "../../../core/middlewares/RefuserRoles"
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur"
import PresenceEnseignantController from "../controllers/PresenceEnseignantController"

const router = express.Router()
const controller = new PresenceEnseignantController()

router.get('/seances/:seanceId/presences', [Authenticate, RefuserRoles(RolesUtilisateur.PARENT)], controller.getPresencesParSeanceV2.bind(controller))
router.post('/seances/:seanceId/generer-presences', [AuthEnseignant], controller.genererPresencesPourSeance.bind(controller))
router.put('/presences-cours-participants/:id', [AuthEnseignant], controller.mettreAJourEtatPresence.bind(controller))
router.post('/presences-cours-participants/massive', [AuthEnseignant], controller.mettreAJourMassive.bind(controller))

export default router
