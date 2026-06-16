import express from "express"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"
import PresenceController from "../controllers/PresenceController"

const router = express.Router()

router
    .get('/', PresenceController.getAllPresences)
    .post('/', [], PresenceController.createPresence)
    .post('/scan', [], PresenceController.scanPresence)
    .get('/:id', PresenceController.getPresence)
    .put('/:id', [], PresenceController.updatePresence)
    .delete('/:id', [], PresenceController.deletePresence)
    .put('/:id/sign', [AuthEnseignant], PresenceController.signPresence)
    .get('/statistics/count', [], PresenceController.getCount)

export default router