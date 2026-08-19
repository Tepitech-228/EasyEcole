import express from "express"

import FraisScolariteController from "../controllers/FraisScolariteController"

const router = express.Router()

/**
 * @openapi
 * /inscription/fraisScolarite:
 *   get:
 *     tags: [Frais de Scolarité]
 *     summary: Liste tous les paramétrages de frais de scolarité (par session)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des paramétrages de frais de scolarité
 */
router
    .get('/', FraisScolariteController.getAllFraisScolarite)

/**
 * @openapi
 * /inscription/fraisScolarite/session/{sessionId}:
 *   get:
 *     tags: [Frais de Scolarité]
 *     summary: Récupère le paramétrage des frais de scolarité d'une session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paramétrage des frais de scolarité de la session
 *       404:
 *         description: Aucun frais de scolarité paramétré pour cette session
 */
    .get('/session/:sessionId', FraisScolariteController.getFraisScolariteBySession)

/**
 * @openapi
 * /inscription/fraisScolarite:
 *   post:
 *     tags: [Frais de Scolarité]
 *     summary: Crée ou remplace le paramétrage des frais de scolarité d'une session (upsert)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, montant]
 *             properties:
 *               sessionId:
 *                 type: integer
 *               montant:
 *                 type: number
 *               modalite:
 *                 type: string
 *                 enum: ['1x', '3x', '10x']
 *                 default: '10x'
 *               actif:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Paramétrage mis à jour (remplacement)
 *       201:
 *         description: Paramétrage créé
 *       403:
 *         description: Accès refusé (réservé à l'administration)
 */
    .post('/', [], FraisScolariteController.upsertFraisScolarite)

export default router