import express from "express"

import PaiementInscriptionController from "../controllers/PaiementInscriptionController"
import { AuthCaissierBanque } from "../../../core/middlewares/AuthCaissierBanque";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .get('/', PaiementInscriptionController.getAllPaiementsInscription)
    .post('/', PaiementInscriptionController.createPaiementInscription)
    .post('/cinetpay', PaiementInscriptionController.createMobileMoneyPaiementInscription)
    .get('/:id', PaiementInscriptionController.getPaiementInscription)
    .put('/:id', PaiementInscriptionController.updatePaiementInscription)
    .delete('/:id', PaiementInscriptionController.deletePaiementInscription)
    .get('/statistics/count', [], PaiementInscriptionController.getCount)

export default router