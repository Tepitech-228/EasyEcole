import express from "express"
import JournalComptableController from "../controllers/JournalComptableController"
import { AuthCabinetComptable } from "../../../core/middlewares/AuthCabinetComptable"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/journaux:
 *   get:
 *     tags: [Journaux Comptables]
 *     summary: Liste tous les journaux comptables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des journaux comptables
 */
router
  .get('/', JournalComptableController.getAllJournaux)

/**
 * @openapi
 * /comptabilite/journaux/{id}:
 *   get:
 *     tags: [Journaux Comptables]
 *     summary: Récupère un journal comptable par ID
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
 *         description: Journal comptable trouvé
 */
  .get('/:id', JournalComptableController.getJournal)

/**
 * @openapi
 * /comptabilite/journaux:
 *   post:
 *     tags: [Journaux Comptables]
 *     summary: Crée un nouveau journal comptable
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
 *         description: Journal comptable créé
 */
  .post('/', [AuthCabinetComptable, CheckPermission('action.comptabilite.journal.creer')], JournalComptableController.createJournal)

export default router
