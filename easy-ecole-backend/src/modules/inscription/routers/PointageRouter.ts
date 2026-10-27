import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"

import PointageController from "../controllers/PointageController"
import PointageTerminalController from "../controllers/PointageTerminalController"
import HikvisionTerminalController from "../controllers/HikvisionTerminalController"

const router = express.Router()

/**
 * @openapi
 * /inscription/pointages:
 *   get:
 *     tags: [Pointage]
 *     summary: Liste tous les pointages
 *     responses:
 *       200:
 *         description: Liste des pointages
 */
router
    .get('/terminaux', [Authenticate], PointageTerminalController.getTerminaux)
    .post('/terminaux', [Authenticate], PointageTerminalController.creerTerminal)
    .put('/terminaux/:id', [Authenticate], PointageTerminalController.modifierTerminal)
    .get('/hikvision-terminaux', [Authenticate], HikvisionTerminalController.getAll)
    .post('/hikvision-terminaux', [Authenticate], HikvisionTerminalController.create)
    .put('/hikvision-terminaux/:id', [Authenticate], HikvisionTerminalController.updateActive)
    .post('/hikvision-terminaux/:id/test', [Authenticate], HikvisionTerminalController.testConnection)
    .get('/', [Authenticate], PointageController.getAllPointages)
    .get('/today', [Authenticate], PointageController.getTodayPointage)
    .get('/rapport', [Authenticate], PointageController.getRapport)
    /**
     * @openapi
     * /inscription/pointages/export:
     *   get:
     *     tags: [Pointage]
     *     summary: Exporte l'historique des pointages (Excel ou Word)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: format
     *         schema: { type: string, enum: [xlsx, docx], default: xlsx }
     *       - in: query
     *         name: debut
     *         schema: { type: string, format: date }
     *       - in: query
     *         name: fin
     *         schema: { type: string, format: date }
     *       - in: query
     *         name: role
     *         schema: { type: string }
     *       - in: query
     *         name: search
     *         schema: { type: string }
     *       - in: query
     *         name: statut
     *         schema: { type: string, enum: [complet, en_cours] }
     *     responses:
     *       200:
     *         description: Fichier Excel ou Word
     *       404:
     *         description: Aucun pointage pour ces critères
     */
    .get('/export', [Authenticate], PointageController.exportPointages)
    .post('/arrivee', [Authenticate], PointageController.pointerArrivee)
    .post('/depart', [Authenticate], PointageController.pointerDepart)
    .post('/scan/arrivee', [Authenticate], PointageController.pointerArriveeByScan)
    .post('/scan/depart', [Authenticate], PointageController.pointerDepartByScan)
    /**
     * @openapi
     * /inscription/pointages/scan/pointage:
     *   post:
     *     tags: [Pointage]
     *     summary: Valide un QR signé puis détermine automatiquement le pointage selon le profil
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [codeQR]
     *             properties:
     *               codeQR: { type: string }
     *               mode:
     *                 type: string
     *                 enum: [arrivee, depart]
     *                 description: Ignoré; le serveur détermine l'action selon le profil et les pointages du jour.
     *     description: >
     *       Le personnel a une arrivée au premier scan puis un départ au deuxième.
     *       Pour un étudiant, chaque scan est conservé dans l'historique; le premier
     *       fixe l'arrivée et le dernier scan fixe le départ de la journée.
     *     responses:
     *       201:
     *         description: Arrivée enregistrée
     *       200:
     *         description: Départ enregistré
     *       400:
     *         description: QR invalide ou pointage déjà effectué
     *       403:
     *         description: Rôle ou situation de l'employé non autorisé
     *       404:
     *         description: Utilisateur ou arrivée introuvable
     */
    .post('/scan/pointage', [Authenticate], PointageController.pointerParQR)
    .get('/scan/verifier-statut/:codeQR', [Authenticate], PointageController.verifierStatutByQR)
    .get('/mon-qr', [Authenticate], PointageController.getMonQr)

export default router
