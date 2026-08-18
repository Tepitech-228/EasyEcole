import express from "express"

import EcheanceController from "../controllers/EcheanceController"

const router = express.Router()

/**
 * GET /inscription/paiement/statut — statut de paiement de l'utilisateur connecté
 * (rôles APPRENANT et PARENT). Route exposée à l'étudiant : elle suit le pattern
 * des autres routes « apprenant » du module inscription (aucune permission clé
 * CheckPermission, seul le rôle est vérifié dans le contrôleur), ce qui garantit
 * que l'étudiant peut toujours consulter son statut même en situation de blocage
 * (menu restreint). La vérification de rôle se fait dans EcheanceController.getStatutPaiement.
 *
 * @openapi
 * /inscription/paiement/statut:
 *   get:
 *     tags: [Échéances]
 *     summary: Statut de paiement de l'utilisateur connecté (apprenant ou parent)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Statut de paiement (vert/rouge, montant restant, prochaine échéance)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Rôle non autorisé (ni apprenant, ni parent)
 */
router
    .get('/statut', EcheanceController.getStatutPaiement)

export default router