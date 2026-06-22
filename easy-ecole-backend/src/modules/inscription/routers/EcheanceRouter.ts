import express from "express"

import EcheanceController from "../controllers/EcheanceController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()

router
    /**
     * @openapi
     * /inscription/echeances:
     *   get:
     *     tags: [Échéances]
     *     summary: Liste toutes les échéances (filtré par étudiant pour apprenant)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: dossierEtudiantId
     *         schema:
     *           type: string
     *         description: Filtrer par dossier étudiant
     *       - in: query
     *         name: statut
     *         schema:
     *           type: string
     *           enum: [impaye, paye, en_retard]
     *         description: Filtrer par statut
     *     responses:
     *       200:
     *         description: Liste des échéances
     */
    .get('/', EcheanceController.getAllEcheances)
    /**
     * @openapi
     * /inscription/echeances/{id}:
     *   get:
     *     tags: [Échéances]
     *     summary: Récupère une échéance par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'échéance
     */
    .get('/:id', EcheanceController.getEcheance)
    /**
     * @openapi
     * /inscription/echeances:
     *   post:
     *     tags: [Échéances]
     *     summary: Crée une nouvelle échéance (institution uniquement)
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - dossierEtudiantId
     *               - type
     *               - numeroEcheance
     *               - montant
     *               - dateLimite
     *             properties:
     *               dossierEtudiantId:
     *                 type: string
     *               type:
     *                 type: string
     *                 enum: [inscription, scolarite]
     *               numeroEcheance:
     *                 type: integer
     *               montant:
     *                 type: number
     *               dateLimite:
     *                 type: string
     *                 format: date
     *               moisConcerne:
     *                 type: string
     *     responses:
     *       201:
     *         description: Échéance créée
     */
    .post('/', [AuthInstitution], EcheanceController.createEcheance)
    /**
     * @openapi
     * /inscription/echeances/{id}:
     *   put:
     *     tags: [Échéances]
     *     summary: Met à jour une échéance (institution uniquement)
     *     security: [{ bearerAuth: [] }]
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
     *               type:
     *                 type: string
     *               montant:
     *                 type: number
     *               dateLimite:
     *                 type: string
     *                 format: date
     *               statut:
     *                 type: string
     *                 enum: [impaye, paye, en_retard]
     *     responses:
     *       200:
     *         description: Échéance mise à jour
     */
    .put('/:id', [AuthInstitution], EcheanceController.updateEcheance)
    /**
     * @openapi
     * /inscription/echeances/{id}:
     *   delete:
     *     tags: [Échéances]
     *     summary: Supprime une échéance (institution uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Échéance supprimée
     */
    .delete('/:id', [AuthInstitution], EcheanceController.deleteEcheance)
    /**
     * @openapi
     * /inscription/echeances/generer/{dossierEtudiantId}:
     *   post:
     *     tags: [Échéances]
     *     summary: Génère automatiquement les échéances pour un dossier étudiant (institution uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: dossierEtudiantId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       201:
     *         description: Échéances générées
     */
    .post('/generer/:dossierEtudiantId', [AuthInstitution], EcheanceController.genererEcheances)

export default router
