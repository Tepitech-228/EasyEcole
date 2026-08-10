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
    .get('/:id/recu', PaiementInscriptionController.getPaymentReceipt)
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
    /**
     * @openapi
     * /inscription/paiementsInscription/mobile-money:
     *   post:
     *     tags: [Paiements]
     *     summary: Crée un paiement par mobile money (Cinetpay)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               matriculeInscription:
     *                 type: string
     *               montant:
     *                 type: number
     *               customerPhone:
     *                 type: string
     *               redirectUrl:
     *                 type: string
     *               callbackUrl:
     *                 type: string
     *     responses:
     *       201:
     *         description: Paiement créé avec URL de paiement
     */
    .post('/mobile-money', PaiementInscriptionController.createMobileMoneyPayment)
    /**
     * @openapi
     * /inscription/paiementsInscription/mobile-money/{transactionId}:
     *   get:
     *     tags: [Paiements]
     *     summary: Vérifie le statut d'un paiement mobile money
     *     parameters:
     *       - in: path
     *         name: transactionId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Statut du paiement
     */
    .get('/mobile-money/:transactionId', PaiementInscriptionController.checkMobileMoneyPayment)

export default router