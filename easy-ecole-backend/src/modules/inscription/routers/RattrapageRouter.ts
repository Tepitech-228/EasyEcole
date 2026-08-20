import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import { InscriptionComplete } from "../../../core/middlewares/InscriptionComplete";
import RattrapageController from "../controllers/RattrapageController";

const router = express.Router();

// Appliquer les middlewares d'authentification à toutes les routes
router.use([Authenticate, InscriptionComplete]);

router.get('/', RattrapageController.getAll);
router.get('/sessions', RattrapageController.getSessions);
router.get('/stats', RattrapageController.getStats);
router.get('/enseignant/prochain-cours', RattrapageController.getProchainCoursEnseignant);

// Sessions de rattrapage (admin configuration)
router.post('/sessions', RattrapageController.creerSessionRattrapage);
router.get('/sessions/:id/documents-requis', RattrapageController.getDocumentsRequisSession);

// Routes pour les demandes de rattrapage étudiant (placées avant les routes paramétrées)
router.get('/demandes', RattrapageController.getDemandes);
router.post('/demandes', RattrapageController.creerDemandeEtudiant);
router.get('/mes-demandes', RattrapageController.getMesDemandes);
router.get('/demandes/enseignants-disponibles', RattrapageController.getEnseignantsDisponibles);
router.get('/demandes/:id/verifier-completude', RattrapageController.verifierCompletuDeDemande);

// Document management workflow
router.post('/demandes/:id/documents', RattrapageController.televerserDocumentRattrapage);

// Committee validation
router.put('/demandes/:id/valider', RattrapageController.validerDemandeRattrapage);

// Institution/Admin programming and payment confirmation
router.put('/demandes/:id/programmer', RattrapageController.programmerDemande);
router.put('/demandes/:id/valider-paiement', RattrapageController.validerPaiementRattrapage);
router.post('/demandes/:id/bordereau', RattrapageController.creerBordereauDemande);
router.put('/demandes/:id/confirmer-paiement', RattrapageController.confirmerPaiementDemande);
router.post('/demandes/:id/confirmer-paiement-auto', RattrapageController.confirmerPaiementAutoDemande);

router.get('/:id', RattrapageController.get);
router.post('/', RattrapageController.create);
router.post('/notifier', RattrapageController.notifierEtudiants);
router.put('/notes', RattrapageController.saveNotes);
router.put('/:id', RattrapageController.update);
router.delete('/:id', RattrapageController.delete);

export default router;
