import express from "express"

import CahierDeTexteController from "../controllers/CahierDeTexteController"

const router = express.Router()

router
    .get('/', CahierDeTexteController.getAllCahiersDeTexte)
    .post('/', [], CahierDeTexteController.createCahierDeTexte)
    .get('/:id', CahierDeTexteController.getCahierDeTexte)
    .put('/:id', [], CahierDeTexteController.updateCahierDeTexte)
    .delete('/:id', [], CahierDeTexteController.deleteCahierDeTexte)
    .get('/statistics/count', [], CahierDeTexteController.getCount)

export default router