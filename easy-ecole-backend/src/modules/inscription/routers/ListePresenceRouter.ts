import express from "express"

import ListePresenceController from "../controllers/ListePresenceController"

const router = express.Router()

router
    .get('/', ListePresenceController.getAllListesPresences)
    .post('/', [], ListePresenceController.createListePresence)
    .get('/:id', ListePresenceController.getListePresence)
    .put('/:id', [], ListePresenceController.updateListePresence)
    .delete('/:id', [], ListePresenceController.deleteListePresence)
    .get('/statistics/count', [], ListePresenceController.getCount)

export default router