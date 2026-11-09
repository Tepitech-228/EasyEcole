import express from "express"
import SecretariatDashboardController from "../controllers/SecretariatDashboardController"
import DemandeDocumentController from "../controllers/DemandeDocumentController"
import DocumentController from "../controllers/DocumentController"
import RecuCaisseController from "../controllers/RecuCaisseController"
import ClotureCaisseController from "../controllers/ClotureCaisseController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthSecretariat } from "../../../core/middlewares/AuthSecretariat"
import { AuthRecouvrement } from "../../../core/middlewares/AuthRecouvrement"
import { cache } from "../../../core/middlewares/CacheMiddleware"

const router = express.Router()

router.use(Authenticate)

// Lectures agrégées coûteuses → cache Redis 60 s (clé par utilisateur)
router.get('/dashboard/stats', [AuthSecretariat, cache(60)], SecretariatDashboardController.getStats)
router.get('/dashboard/activity', [AuthSecretariat, cache(60)], SecretariatDashboardController.getRecentActivity)

router.get('/demandesDocument', [AuthSecretariat], DemandeDocumentController.getAllDemandesDocument)
/**
 * @openapi
 * /scolarite/secretariat/demandesDocument/file-impression:
 *   get:
 *     tags: [Recouvrement]
 *     summary: Liste les documents prêts à imprimer ou déjà imprimés
 *     parameters:
 *       - in: query
 *         name: etat
 *         schema:
 *           type: string
 *           enum: [a_imprimer, imprimes]
 *     responses:
 *       200:
 *         description: File d'impression paginée
 */
router.get('/demandesDocument/file-impression', [AuthSecretariat], DemandeDocumentController.getFileImpression)
router.get('/demandesDocument/:id', [AuthSecretariat], DemandeDocumentController.getDemandeDocument)
router.put('/demandesDocument/:id/preparer', [AuthSecretariat], DemandeDocumentController.preparerDocument)
router.put('/demandesDocument/:id/generer', [AuthSecretariat], DemandeDocumentController.genererDocument)
router.put('/demandesDocument/:id/imprimer', [AuthSecretariat], DemandeDocumentController.imprimerDocument)
router.put('/demandesDocument/:id/remettre', [AuthSecretariat], DemandeDocumentController.remettreDocument)
router.put('/demandesDocument/:id/rejeter', [AuthSecretariat], DemandeDocumentController.rejeterDemande)

router.get('/typesDocument', [AuthSecretariat], DocumentController.getAllTypesDocument)
/**
 * @openapi
 * /scolarite/secretariat/typesDocument/tarifs:
 *   get:
 *     tags: [Secrétariat]
 *     summary: Liste les tarifs des types de documents pour le recouvrement
 *     responses:
 *       200:
 *         description: Identifiants, libellés et frais des types de documents
 */
router.get('/typesDocument/tarifs', [AuthRecouvrement], DocumentController.getTarifsTypesDocument)
router.post('/typesDocument', [AuthSecretariat], DocumentController.createTypeDocument)
router.get('/typesDocument/:id', [AuthSecretariat], DocumentController.getTypeDocument)
/**
 * @openapi
 * /scolarite/secretariat/typesDocument/{id}/frais:
 *   put:
 *     tags: [Recouvrement]
 *     summary: Met à jour uniquement les frais d'un type de document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [frais]
 *             properties:
 *               frais:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Tarif mis à jour
 */
router.put('/typesDocument/:id/frais', [AuthRecouvrement], DocumentController.updateTarifTypeDocument)
router.put('/typesDocument/:id', [AuthSecretariat], DocumentController.updateTypeDocument)
router.delete('/typesDocument/:id', [AuthSecretariat], DocumentController.deleteTypeDocument)

router.get('/recusCaisse', [AuthRecouvrement], RecuCaisseController.getAll)
router.get('/recusCaisse/:id', [AuthRecouvrement], RecuCaisseController.getById)
router.get('/recusCaisse/:id/print', [AuthRecouvrement], RecuCaisseController.print)
router.get('/recusCaisse/:id/download', RecuCaisseController.download)
router.post('/recusCaisse/collecter', [AuthRecouvrement], RecuCaisseController.paiementApresCreationDesactive)
router.get('/recusCaisse/demandes-documents/etudiants', [AuthRecouvrement], RecuCaisseController.getEtudiantsPourPaiement)
router.get('/recusCaisse/demandes-documents/types', [AuthRecouvrement], RecuCaisseController.getTypesDocumentsPayants)
router.post('/recusCaisse/demandes-documents/encaisser', [AuthRecouvrement], RecuCaisseController.collecterPaiementDemandeDocument)
router.get('/recusCaisse/demandes-documents/:id/download', [AuthRecouvrement], RecuCaisseController.download)
router.get('/journalCaisse', [AuthRecouvrement], RecuCaisseController.getJournalCaisse)

router.get('/cloturesCaisse', [AuthRecouvrement], ClotureCaisseController.getAll)
router.post('/cloturesCaisse/ouvrir', [AuthRecouvrement], ClotureCaisseController.ouvrir)
router.put('/cloturesCaisse/:id/cloturer', [AuthRecouvrement], ClotureCaisseController.cloturer)
router.get('/cloturesCaisse/:id/journal', [AuthRecouvrement], ClotureCaisseController.getJournal)

export default router
