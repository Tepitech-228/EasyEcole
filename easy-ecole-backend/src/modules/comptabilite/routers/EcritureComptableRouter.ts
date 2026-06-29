import express from "express"
import EcritureComptableController from "../controllers/EcritureComptableController"
import { AuthCabinetComptable } from "../../../core/middlewares/AuthCabinetComptable"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/ecritures:
 *   get:
 *     tags: [Écritures Comptables]
 *     summary: Liste toutes les écritures comptables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des écritures comptables
 */
router
  .get('/', EcritureComptableController.getAllEcritures)

/**
 * @openapi
 * /comptabilite/ecritures/grand-livre/{compteId}:
 *   get:
 *     tags: [Écritures Comptables]
 *     summary: Récupère le grand livre d'un compte
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: compteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grand livre trouvé
 */
  .get('/grand-livre/:compteId', EcritureComptableController.getGrandLivre)

/**
 * @openapi
 * /comptabilite/ecritures/balance/all:
 *   get:
 *     tags: [Écritures Comptables]
 *     summary: Récupère la balance comptable
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance comptable
 */
  .get('/balance/all', EcritureComptableController.getBalance)

/**
 * @openapi
 * /comptabilite/ecritures/{id}:
 *   get:
 *     tags: [Écritures Comptables]
 *     summary: Récupère une écriture comptable par ID
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
 *         description: Écriture comptable trouvée
 */
  .get('/:id', EcritureComptableController.getEcriture)

/**
 * @openapi
 * /comptabilite/ecritures:
 *   post:
 *     tags: [Écritures Comptables]
 *     summary: Crée une nouvelle écriture comptable
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
 *         description: Écriture comptable créée
 */
  .post('/', EcritureComptableController.createEcriture)

/**
 * @openapi
 * /comptabilite/ecritures/{id}/valider:
 *   put:
 *     tags: [Écritures Comptables]
 *     summary: Valide une écriture comptable
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
 *         description: Écriture comptable validée
 */
  .put('/:id/valider', [AuthCabinetComptable, CheckPermission('action.comptabilite.ecriture.valider')], EcritureComptableController.validerEcriture)

export default router
