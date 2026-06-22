import express from "express"

import PaiementInscriptionController from "../controllers/PaiementInscriptionController"
import { AuthCaissierBanque } from "../../../core/middlewares/AuthCaissierBanque";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

/**
 * @openapi
 * /inscription/paiementsInscription:
 *   get:
 *     tags: [Paiements]
 *     summary: Liste tous les paiements d'inscription
 *     responses:
 *       200:
 *         description: Liste des paiements
 */
router
    .get('/', PaiementInscriptionController.getAllPaiementsInscription)
/**
 * @openapi
 * /inscription/paiementsInscription:
 *   post:
 *     tags: [Paiements]
 *     summary: Crée un nouveau paiement d'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Paiement créé
 */
    .post('/', PaiementInscriptionController.createPaiementInscription)
/**
 * @openapi
 * /inscription/paiementsInscription/cinetpay:
 *   post:
 *     tags: [Paiements]
 *     summary: Crée un paiement mobile money via CinetPay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Paiement mobile money initié
 */
    .post('/cinetpay', PaiementInscriptionController.createMobileMoneyPaiementInscription)
/**
 * @openapi
 * /inscription/paiementsInscription/{id}:
 *   get:
 *     tags: [Paiements]
 *     summary: Récupère un paiement d'inscription par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du paiement
 *     responses:
 *       200:
 *         description: Détail du paiement
 *       404:
 *         description: Paiement non trouvé
 */
    .get('/:id', PaiementInscriptionController.getPaiementInscription)
/**
 * @openapi
 * /inscription/paiementsInscription/{id}:
 *   put:
 *     tags: [Paiements]
 *     summary: Met à jour un paiement d'inscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Paiement mis à jour
 *       404:
 *         description: Paiement non trouvé
 */
    .put('/:id', PaiementInscriptionController.updatePaiementInscription)
/**
 * @openapi
 * /inscription/paiementsInscription/{id}:
 *   delete:
 *     tags: [Paiements]
 *     summary: Supprime un paiement d'inscription
 *     responses:
 *       200:
 *         description: Paiement supprimé
 *       404:
 *         description: Paiement non trouvé
 */
    .delete('/:id', PaiementInscriptionController.deletePaiementInscription)
/**
 * @openapi
 * /inscription/paiementsInscription/statistics/count:
 *   get:
 *     tags: [Paiements]
 *     summary: Retourne le nombre total de paiements
 *     responses:
 *       200:
 *         description: Nombre de paiements
 */
    .get('/statistics/count', [], PaiementInscriptionController.getCount)

export default router