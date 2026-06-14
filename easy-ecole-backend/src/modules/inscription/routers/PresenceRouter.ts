import express from "express"

import PresenceController from "../controllers/PresenceController"

const router = express.Router()

router
    .get('/', PresenceController.getAllPresences)
    .post('/', [], PresenceController.createPresence)
    .get('/:id', PresenceController.getPresence)
    .put('/:id', [], PresenceController.updatePresence)
    .delete('/:id', [], PresenceController.deletePresence)
    .get('/statistics/count', [], PresenceController.getCount)

export default router