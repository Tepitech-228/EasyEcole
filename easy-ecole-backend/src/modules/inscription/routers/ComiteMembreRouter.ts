import express from "express"
import ComiteMembreController from "../controllers/ComiteMembreController"
import Authenticate from "../../../core/middlewares/Authenticate"

/**
 * Routes d'administration des membres du comité d'orientation.
 * Monté sous /inscription/admin/comite-membres dans InscriptionRoutes.ts.
 * Le contrôle de rôle (ADMIN) est fait dans le contrôleur.
 */
const router = express.Router()

router
    .get('/', [Authenticate], ComiteMembreController.listerMembres)
    .post('/', [Authenticate], ComiteMembreController.creerMembre)
    .delete('/:id', [Authenticate], ComiteMembreController.supprimerMembre)

export default router
