import express from "express"

import DemandeInscriptionController from "../controllers/DemandeInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()

/**
 * @openapi
 * /inscription/demandesInscription:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Liste toutes les demandes d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes d'inscription
 */
router
    .get('/', DemandeInscriptionController.getAllDemandesInscription)

/**
 * @openapi
 * /inscription/demandesInscription:
 *   post:
 *     tags: [Demandes d'Inscription]
 *     summary: Crée une nouvelle demande d'inscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Demande d'inscription créée
 */
    .post('/', [], DemandeInscriptionController.createDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Récupère une demande d'inscription par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demande d'inscription trouvée
 */
    .get('/:id', DemandeInscriptionController.getDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/paiement/{matricule}:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Récupère une demande d'inscription depuis un paiement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matricule
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demande d'inscription trouvée
 */
    .get('/paiement/:matricule', DemandeInscriptionController.getDemandeInscriptionFromPaiement)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/cours:
 *   post:
 *     tags: [Demandes d'Inscription]
 *     summary: Ajoute des cours à une demande d'inscription
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       201:
 *         description: Cours ajoutés à la demande
 */
    .post('/:id/cours', [ ], DemandeInscriptionController.createDemandeInscriptionCours)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/cours:
 *   put:
 *     tags: [Demandes d'Inscription]
 *     summary: Met à jour les cours d'une demande d'inscription
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Cours de la demande mis à jour
 */
    .put('/:id/cours', [ ], DemandeInscriptionController.updateDemandeInscriptionCours)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   put:
 *     tags: [Demandes d'Inscription]
 *     summary: Valide une demande d'inscription
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Demande d'inscription validée
 */
    .put('/:id', [], DemandeInscriptionController.validerDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   delete:
 *     tags: [Demandes d'Inscription]
 *     summary: Supprime une demande d'inscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demande d'inscription supprimée
 */
    .delete('/:id', [], DemandeInscriptionController.deleteDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/statistics/count:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Compte le nombre de demandes d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de demandes d'inscription
 */
    .get('/statistics/count', [], DemandeInscriptionController.getCount)

export default router