import express from "express"
import ComiteValidationController from "../controllers/ComiteValidationController"
import { AuthenticateComite } from "../../../core/middlewares/Authenticate"

/**
 * Routes de validation finale des dossiers d'inscription par le COMITÉ.
 * Monté sous /inscription/comite-validations dans InscriptionRoutes.ts.
 * Le contrôle de rôle (COMITE_ORIENTATION / ADMIN) est fait dans le contrôleur.
 */
const router = express.Router()

router
    .get('/dossiers', [AuthenticateComite], ComiteValidationController.listerDossiers)
    .get('/dossiers/:id/pdf-fusionne', [AuthenticateComite], ComiteValidationController.telechargerPdfFusionne)
    .get('/dossiers/:id', [AuthenticateComite], ComiteValidationController.detailDossier)
    .get('/dossiers/:id/votes', [AuthenticateComite], ComiteValidationController.listerVotes)
    .post('/dossiers/:id/decider', [AuthenticateComite], ComiteValidationController.decider)

export default router
