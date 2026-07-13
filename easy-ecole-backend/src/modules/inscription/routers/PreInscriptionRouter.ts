import express from "express"

import PreInscriptionController from "../controllers/PreInscriptionController"
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthComiteOrientation } from "../../../core/middlewares/AuthComiteOrientation";

const router = express.Router()

/**
 * @openapi
 * /inscription/preInscriptions:
 *   get:
 *     tags: [Pré-Inscriptions]
 *     summary: Liste toutes les pré-inscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des pré-inscriptions
 */
router
    .get('/', [Authenticate], PreInscriptionController.getAll)

/**
 * @openapi
 * /inscription/preInscriptions/demandes-en-attente:
 *   get:
 *     tags: [Pré-Inscriptions]
 *     summary: Liste les demandes de pré-inscription en attente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Demandes en attente
 */
    .get('/demandes-en-attente', [Authenticate], PreInscriptionController.getDemandesEnAttente)

/**
 * @openapi
 * /inscription/preInscriptions/all-demandes:
 *   get:
 *     tags: [Pré-Inscriptions]
 *     summary: Liste toutes les demandes d'inscription (comité)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de toutes les demandes
 */
    .get('/all-demandes', [Authenticate], PreInscriptionController.getAllDemandes)

/**
 * @openapi
 * /inscription/preInscriptions/demande/{id}:
 *   get:
 *     tags: [Pré-Inscriptions]
 *     summary: Détails d'une demande d'inscription (comité)
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
 *         description: Détails de la demande
 */
    .get('/demande/:id', [Authenticate], PreInscriptionController.getDemandeDetails)

/**
 * @openapi
 * /inscription/preInscriptions/{id}/autorisation:
 *   get:
 *     tags: [Pré-Inscriptions]
 *     summary: Télécharge l'autorisation provisoire PDF
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
 *         description: Fichier PDF d'autorisation provisoire
 *       404:
 *         description: Autorisation non trouvée
 */
    .get('/:id/autorisation', [Authenticate], PreInscriptionController.telechargerAutorisation)

/**
 * @openapi
 * /inscription/preInscriptions/{demandeId}/soumettre:
 *   post:
 *     tags: [Pré-Inscriptions]
 *     summary: Soumet une demande de pré-inscription après vérification des documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: demandeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pré-inscription soumise avec succès
 *       400:
 *         description: Documents manquants
 */
    .post('/:demandeId/soumettre', [Authenticate], PreInscriptionController.soumettre)

/**
 * @openapi
 * /inscription/preInscriptions/{id}/valider:
 *   put:
 *     tags: [Pré-Inscriptions]
 *     summary: Valide une pré-inscription par le comité d'orientation (génère autorisation PDF)
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
 *         description: Pré-inscription validée
 */
    .put('/:id/valider', [Authenticate, AuthComiteOrientation], PreInscriptionController.valider)

/**
 * @openapi
 * /inscription/preInscriptions/{id}/rejeter:
 *   put:
 *     tags: [Pré-Inscriptions]
 *     summary: Rejette une pré-inscription
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
 *         description: Pré-inscription rejetée
 */
    .put('/:id/rejeter', [Authenticate, AuthComiteOrientation], PreInscriptionController.rejeter)

export default router
