import express from "express"

import DemandeDocumentController from "../controllers/DemandeDocumentController"

const router = express.Router()

router
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Liste toutes les demandes de documents
     *     responses:
     *       200:
     *         description: Liste des demandes
     */
    .get('/', DemandeDocumentController.getAllDemandesDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   post:
     *     tags: [Demandes de documents]
     *     summary: Crée une nouvelle demande de document
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               typeDocumentId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Demande créée
     */
    .post('/', DemandeDocumentController.createDemandeDocument)
    .put('/batch/statut', DemandeDocumentController.batchStatut)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Récupère une demande par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la demande
     */
    .get('/:id', DemandeDocumentController.getDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   put:
     *     tags: [Demandes de documents]
     *     summary: Traite une demande (valider/rejeter/délivrer)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               statut:
     *                 type: string
     *     responses:
     *       200:
     *         description: Demande mise à jour
     */
    .put('/:id', DemandeDocumentController.traiterDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/verifier-acces:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Indique si la demande est gratuite ou payante (montant, frais payés, source)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Informations d'accès au document
     */
    .get('/:id/verifier-acces', DemandeDocumentController.verifierAccesDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/bordereau:
     *   post:
     *     tags: [Demandes de documents]
     *     summary: Génère un bordereau de paiement pour la demande de document payante
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       201:
     *         description: Bordereau créé
     */
    .post('/:id/bordereau', DemandeDocumentController.creerBordereauDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/confirmer-paiement:
     *   put:
     *     tags: [Demandes de documents]
     *     summary: Confirme l'encaissement d'une demande payante (institution/caissier)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               paiementId:
     *                 type: integer
     *                 description: Référence du paiement/bordereau (facultatif)
     *     responses:
     *       200:
     *         description: Demande marquée comme payée
     */
    .put('/:id/confirmer-paiement', DemandeDocumentController.confirmerPaiementDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/confirmer-paiement-auto:
     *   post:
     *     tags: [Demandes de documents]
     *     summary: Confirme un paiement en ligne (crée le paiement et l'écriture comptable automatiquement)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Paiement en ligne confirmé et écriture comptable générée
     */
    .post('/:id/confirmer-paiement-auto', DemandeDocumentController.confirmerPaiementAutoDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   delete:
     *     tags: [Demandes de documents]
     *     summary: Supprime une demande
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Demande supprimée
     */
    .delete('/:id', DemandeDocumentController.deleteDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/statistics/count:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Retourne le nombre total de demandes
     *     responses:
     *       200:
     *         description: Nombre de demandes
     */
    .get('/statistics/count', DemandeDocumentController.getCount)

export default router
