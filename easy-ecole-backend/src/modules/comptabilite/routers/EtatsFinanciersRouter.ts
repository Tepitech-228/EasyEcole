import express from "express"
import EtatsFinanciersController from "../controllers/EtatsFinanciersController"
import Authenticate from "../../../core/middlewares/Authenticate"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/etats-financiers/bilan:
 *   get:
 *     tags: [États Financiers]
 *     summary: Bilan comptable à une date d'arrêté
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateArrete
 *         schema:
 *           type: string
 *           format: date
 *         description: "Date d'arrêté du bilan (ex: 2026-12-31)"
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: integer
 *         description: ID de l'exercice comptable
 *     responses:
 *       200:
 *         description: Bilan comptable
 */
router.get('/bilan', [Authenticate, CheckPermission('comptabilite.bilan.consulter')], EtatsFinanciersController.getBilan)

/**
 * @openapi
 * /comptabilite/etats-financiers/bilan/export:
 *   get:
 *     tags: [États Financiers]
 *     summary: Export du bilan (PDF ou Excel)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, xlsx]
 *         description: Format d'export (pdf par défaut)
 *       - in: query
 *         name: dateArrete
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fichier exporté
 */
router.get('/bilan/export', [Authenticate, CheckPermission('comptabilite.bilan.exporter')], EtatsFinanciersController.exportBilan)

/**
 * @openapi
 * /comptabilite/etats-financiers/compte-resultat:
 *   get:
 *     tags: [États Financiers]
 *     summary: Compte de résultat sur une période
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début de période
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin de période
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compte de résultat
 */
router.get('/compte-resultat', [Authenticate, CheckPermission('comptabilite.resultat.consulter')], EtatsFinanciersController.getCompteResultat)

/**
 * @openapi
 * /comptabilite/etats-financiers/compte-resultat/export:
 *   get:
 *     tags: [États Financiers]
 *     summary: Export du compte de résultat (PDF ou Excel)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, xlsx]
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fichier exporté
 */
router.get('/compte-resultat/export', [Authenticate, CheckPermission('comptabilite.resultat.exporter')], EtatsFinanciersController.exportCompteResultat)

export default router
