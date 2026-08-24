import express from "express"
import ComiteValidationController from "../controllers/ComiteValidationController"
import Authenticate from "../../../core/middlewares/Authenticate"

/**
 * Routes de validation finale des dossiers d'inscription par le COMITÉ.
 * Monté sous /inscription/comite-validations dans InscriptionRoutes.ts.
 * Le contrôle de rôle (COMITE_ORIENTATION / ADMIN) est fait dans le contrôleur.
 */
const router = express.Router()

router
    .get('/dossiers', [Authenticate], ComiteValidationController.listerDossiers)
    .get('/dossiers/:id', [Authenticate], ComiteValidationController.detailDossier)
    .post('/dossiers/:id/decider', [Authenticate], ComiteValidationController.decider)

export default router
