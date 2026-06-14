import express from "express"

import ReponseInscriptionController from "../controllers/ReponseInscriptionController"

const router = express.Router()

router
    .get('/', ReponseInscriptionController.getAllReponsesInscription)
    .post('/', [], ReponseInscriptionController.createReponseInscription)
    .get('/:id', ReponseInscriptionController.getReponseInscription)
    // .put('/:id', [], ReponseInscriptionController.updateReponseInscription)
    .delete('/:id', [], ReponseInscriptionController.deleteReponseInscription)
    .get('/statistics/count', [], ReponseInscriptionController.getCount)

export default router