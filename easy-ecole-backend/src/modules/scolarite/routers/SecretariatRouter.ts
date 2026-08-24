import express from "express"
import SecretariatDashboardController from "../controllers/SecretariatDashboardController"
import DemandeDocumentController from "../controllers/DemandeDocumentController"
import DocumentController from "../controllers/DocumentController"
import RecuCaisseController from "../controllers/RecuCaisseController"
import ClotureCaisseController from "../controllers/ClotureCaisseController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthSecretariat } from "../../../core/middlewares/AuthSecretariat"

const router = express.Router()

router.use(Authenticate)

router.get('/dashboard/stats', [AuthSecretariat], SecretariatDashboardController.getStats)
router.get('/dashboard/activity', [AuthSecretariat], SecretariatDashboardController.getRecentActivity)

router.get('/demandesDocument', [AuthSecretariat], DemandeDocumentController.getAllDemandesDocument)
router.get('/demandesDocument/:id', [AuthSecretariat], DemandeDocumentController.getDemandeDocument)
router.put('/demandesDocument/:id/preparer', [AuthSecretariat], DemandeDocumentController.preparerDocument)
router.put('/demandesDocument/:id/generer', [AuthSecretariat], DemandeDocumentController.genererDocument)
router.put('/demandesDocument/:id/imprimer', [AuthSecretariat], DemandeDocumentController.imprimerDocument)
router.put('/demandesDocument/:id/remettre', [AuthSecretariat], DemandeDocumentController.remettreDocument)
router.put('/demandesDocument/:id/rejeter', [AuthSecretariat], DemandeDocumentController.rejeterDemande)

router.get('/typesDocument', [AuthSecretariat], DocumentController.getAllTypesDocument)
router.post('/typesDocument', [AuthSecretariat], DocumentController.createTypeDocument)
router.get('/typesDocument/:id', [AuthSecretariat], DocumentController.getTypeDocument)
router.put('/typesDocument/:id', [AuthSecretariat], DocumentController.updateTypeDocument)
router.delete('/typesDocument/:id', [AuthSecretariat], DocumentController.deleteTypeDocument)

router.get('/recusCaisse', [AuthSecretariat], RecuCaisseController.getAll)
router.get('/recusCaisse/:id', [AuthSecretariat], RecuCaisseController.getById)
router.get('/recusCaisse/:id/print', [AuthSecretariat], RecuCaisseController.print)
router.post('/recusCaisse/collecter', [AuthSecretariat], RecuCaisseController.collecterPaiement)
router.get('/journalCaisse', [AuthSecretariat], RecuCaisseController.getJournalCaisse)

router.get('/cloturesCaisse', [AuthSecretariat], ClotureCaisseController.getAll)
router.post('/cloturesCaisse/ouvrir', [AuthSecretariat], ClotureCaisseController.ouvrir)
router.put('/cloturesCaisse/:id/cloturer', [AuthSecretariat], ClotureCaisseController.cloturer)
router.get('/cloturesCaisse/:id/journal', [AuthSecretariat], ClotureCaisseController.getJournal)

export default router
