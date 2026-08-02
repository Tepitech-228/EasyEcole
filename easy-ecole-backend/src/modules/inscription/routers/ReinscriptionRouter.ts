import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate";
import ReinscriptionController from "../controllers/ReinscriptionController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    .post('/envoyer-emails', [Authenticate, AuthInstitution], ReinscriptionController.envoyerEmailsReinscription)
    .get('/confirmer', ReinscriptionController.confirmerReinscription)
    .get('/', [Authenticate], ReinscriptionController.lister)

export default router
