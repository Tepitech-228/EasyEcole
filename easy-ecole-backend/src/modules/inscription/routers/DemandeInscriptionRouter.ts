import express from "express"

import DemandeInscriptionController from "../controllers/DemandeInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()

router
    .get('/', DemandeInscriptionController.getAllDemandesInscription)
    .post('/', [], DemandeInscriptionController.createDemandeInscription)
    .get('/:id', DemandeInscriptionController.getDemandeInscription)
    .get('/paiement/:matricule', DemandeInscriptionController.getDemandeInscriptionFromPaiement)
    .post('/:id/cours', [ ], DemandeInscriptionController.createDemandeInscriptionCours)
    .put('/:id/cours', [ ], DemandeInscriptionController.updateDemandeInscriptionCours)
    .put('/:id', [], DemandeInscriptionController.validerDemandeInscription)
    .delete('/:id', [], DemandeInscriptionController.deleteDemandeInscription)
    .get('/statistics/count', [], DemandeInscriptionController.getCount)

export default router