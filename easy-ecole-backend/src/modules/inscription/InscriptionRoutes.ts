require("./models/_associations")
import express from "express";
import SessionRouter from "./routers/SessionRouter"
import CoursRouter from "./routers/CoursRouter"
import ClasseRouter from "./routers/ClasseRouter"
import ParcoursRouter from "./routers/ParcoursRouter"
import MatierePrerequisRouter from "./routers/MatierePrerequisRouter"
import NiveauEtudeRouter from "./routers/NiveauEtudeRouter"
import PrerequisParcoursRouter from "./routers/PrerequisParcoursRouter"
import ParcoursChoisiRouter from "./routers/ParcoursChoisiRouter"
import PrerequisParcoursChoisiRouter from "./routers/PrerequisParcoursChoisiRouter"
import DemandeInscriptionRouter from "./routers/DemandeInscriptionRouter"
import ReponseInscriptionRouter from "./routers/ReponseInscriptionRouter"
import FraisInscriptionRouter from "./routers/FraisInscriptionRouter"
import Authenticate from "../../core/middlewares/Authenticate";
import { InscriptionComplete } from "../../core/middlewares/InscriptionComplete";
import PaiementInscriptionRouter from "./routers/PaiementInscriptionRouter";
import QuitusRouter from "./routers/QuitusRouter";
import DossierInscriptionRouter from "./routers/DossierInscriptionRouter";
import AnneeAcademiqueRouter from "./routers/AnneeAcademiqueRouter";
import CursusApprenantRouter from "./routers/CursusApprenantRouter";
import SalleDeClasseRouter from "./routers/SalleDeClasseRouter";
import ChapitreCoursRouter from "./routers/ChapitreCoursRouter";
import RessourceRouter from "./routers/RessourceRouter";
import FichierRessourceRouter from "./routers/FichierRessourceRouter";
import SeanceRouter from "./routers/SeanceRouter";
import PresenceRouter from "./routers/PresenceRouter";
import PresenceCoursParticipantRouter from "./routers/PresenceCoursParticipantRouter";
import PresenceEnseignantRouter from "./routers/PresenceEnseignantRouter";
import AbsenceCoursRouter from "./routers/AbsenceCoursRouter";
import ListePresenceRouter from "./routers/ListePresenceRouter";
import CahierDeTexteRouter from "./routers/CahierDeTexteRouter";
import BlocCahierDeTexteRouter from "./routers/BlocCahierDeTexteRouter";
import TypeNoteEvaluationRouter from "./routers/TypeNoteEvaluationRouter";
import ListeNoteEvaluationRouter from "./routers/ListeNoteEvaluationRouter";
import PointageRouter from "./routers/PointageRouter";
import NoteEvaluationRouter from "./routers/NoteEvaluationRouter";
import BulletinRouter from "../bulletins/routers/BulletinRouter"
import DeliberationRouter from "../bulletins/routers/DeliberationRouter"
import EcheanceRouter from "./routers/EcheanceRouter";
import BordereauController from "./controllers/BordereauController";
import BordereauRouter from "./routers/BordereauRouter";
import DossierEtudiantRouter from "./routers/DossierEtudiantRouter";
import HierarchyRouter from "./routers/HierarchyRouter";
import PreInscriptionRouter from "./routers/PreInscriptionRouter";
import ReinscriptionRouter from "./routers/ReinscriptionRouter";
import CartesController from "./controllers/CartesController";

import EcueRouter from "./routers/EcueRouter";
import MccRouter from "./routers/MccRouter";
import RegleEvaluationRouter from "./routers/RegleEvaluationRouter";
import SessionExamenRouter from "./routers/SessionExamenRouter";
import SemestreAcademiqueRouter from "./routers/SemestreAcademiqueRouter";
import AbsenceRouter from "./routers/AbsenceRouter";
import EquivalenceRouter from "./routers/EquivalenceRouter";
import DispenseRouter from "./routers/DispenseRouter";
import RattrapageRouter from "./routers/RattrapageRouter";
import AuditNoteRouter from "../bulletins/routers/AuditNoteRouter";
import EchelleNoteRouter from "../bulletins/routers/EchelleNoteRouter";
import JuryMembreRouter from "../bulletins/routers/JuryMembreRouter";
import PassationRouter from "../bulletins/routers/PassationRouter";
import SuiviUeRouter from "../bulletins/routers/SuiviUeRouter";
import PublicationNoteRouter from "./routers/PublicationNoteRouter";
import FraisParcoursRouter from "./routers/FraisParcoursRouter";
import ReductionFraisRouter from "./routers/ReductionFraisRouter";
import PenaliteRetardRouter from "./routers/PenaliteRetardRouter";
import ExcelRouter from "./routers/ExcelRouter";
import DashboardController from "./controllers/DashboardController";
import CoursController from "./controllers/CoursController";

const router = express.Router();

// Route publique pour téléchargement (sans Authenticate)
router.get('/bordereaux/:id/download', BordereauController.downloadBordereau)

// Route publique pour vérification de carte (sans Authenticate)
router.get('/cartes/verifier/:code', CartesController.verifier)

// Route pour l'arbre pédagogique (accessible depuis /arbre-pedagogique)
router.get('/arbre-pedagogique', [Authenticate], CoursController.getArbrePedagogique)

router
    .use('/sessions', [Authenticate], SessionRouter)
    .use('/cours', [Authenticate], CoursRouter)
    .use('/classes', [Authenticate], ClasseRouter)
    .use('/parcours', [Authenticate], ParcoursRouter)
    .use('/matieres', [Authenticate], MatierePrerequisRouter)
    .use('/niveauxEtude', [Authenticate], NiveauEtudeRouter)
    .use('/prerequisParcours', [Authenticate], PrerequisParcoursRouter)
    .use('/parcoursChoisis', [Authenticate], ParcoursChoisiRouter)
    .use('/prerequisParcoursChoisis', [Authenticate], PrerequisParcoursChoisiRouter)
    .use('/demandesInscription', [Authenticate], DemandeInscriptionRouter)
    .use('/reponsesInscription', [Authenticate], ReponseInscriptionRouter)
    .use('/fraisInscription', [Authenticate], FraisInscriptionRouter)
    .use('/paiementsInscription', [Authenticate], PaiementInscriptionRouter)
    .use('/quitus', [Authenticate], QuitusRouter)
    .use('/dossiersInscription', [Authenticate], DossierInscriptionRouter)
    .use('/anneesAcademiques', [Authenticate], AnneeAcademiqueRouter)
    .use('/cursusApprenant', [Authenticate, InscriptionComplete], CursusApprenantRouter)
    .use('/sallesDeClasse', [Authenticate], SalleDeClasseRouter)
    .use('/chapitresCours', [Authenticate, InscriptionComplete], ChapitreCoursRouter)
    .use('/ressources', [Authenticate, InscriptionComplete], RessourceRouter)
    .use('/fichiersRessource', [Authenticate, InscriptionComplete], FichierRessourceRouter)
    .use('/seances', [Authenticate, InscriptionComplete], SeanceRouter)
    .use('/listesPresences', [Authenticate, InscriptionComplete], ListePresenceRouter)
    .use('/presences', [Authenticate, InscriptionComplete], PresenceRouter)
    .use('/presencesCoursParticipants', [Authenticate, InscriptionComplete], PresenceCoursParticipantRouter)
    // ⚠️ Routes critiques placées AVANT les montages racine pour éviter
    //    que .use('/', ..., InscriptionComplete) n'intercepte toutes les requêtes.
    .use('/pre-inscriptions', [Authenticate], PreInscriptionRouter)
    .use('/bordereaux', [Authenticate], BordereauRouter)
    .use('/hierarchy', [Authenticate], HierarchyRouter)
    .use('/typesNoteEvaluation', [Authenticate], TypeNoteEvaluationRouter)
    .use('/listesNoteEvaluation', [Authenticate], ListeNoteEvaluationRouter)
    .use('/echelles-notes', [Authenticate], EchelleNoteRouter)
    .use('/jury-membres', [Authenticate], JuryMembreRouter)
    .use('/ecues', [Authenticate], EcueRouter)
    .use('/mcc', [Authenticate], MccRouter)
    .use('/regles-evaluation', [Authenticate], RegleEvaluationRouter)
    .use('/semestres-academiques', [Authenticate], SemestreAcademiqueRouter)
    .use('/sessions-examens', [Authenticate], SessionExamenRouter)
    .use('/frais-parcours', [Authenticate], FraisParcoursRouter)
    .use('/reductions-frais', [Authenticate], ReductionFraisRouter)
    .use('/penalites-retard', [Authenticate], PenaliteRetardRouter)
    .use('/excel', [Authenticate], ExcelRouter)
    // Montages racine — ne serviront que pour les routes qui n'ont pas matché ci-dessus
    .use('/', [Authenticate, InscriptionComplete], PresenceEnseignantRouter)
    .use('/', [Authenticate, InscriptionComplete], AbsenceCoursRouter)
    .use('/cahiersDeTexte', [Authenticate, InscriptionComplete], CahierDeTexteRouter)
    .use('/blocsCahierDeTexte', [Authenticate, InscriptionComplete], BlocCahierDeTexteRouter)
    .use('/notesEvaluation', [Authenticate, InscriptionComplete], NoteEvaluationRouter)
    .use('/pointages', [Authenticate, InscriptionComplete], PointageRouter)
    .use('/', [Authenticate, InscriptionComplete], BulletinRouter)
    .use('/', [Authenticate, InscriptionComplete], DeliberationRouter)
    .use('/echeances', [Authenticate, InscriptionComplete], EcheanceRouter)
    .use('/dossiers', [Authenticate, InscriptionComplete], DossierEtudiantRouter)
    .use('/', [Authenticate, InscriptionComplete], PassationRouter)
    .use('/', [Authenticate, InscriptionComplete], SuiviUeRouter)
    .use('/publications-notes', [Authenticate, InscriptionComplete], PublicationNoteRouter)
    .use('/absences', [Authenticate, InscriptionComplete], AbsenceRouter)
    .use('/equivalences', [Authenticate, InscriptionComplete], EquivalenceRouter)
    .use('/dispenses', [Authenticate, InscriptionComplete], DispenseRouter)
    .use('/rattrapages', [Authenticate, InscriptionComplete], RattrapageRouter)
    .use('/audit-notes', [Authenticate, InscriptionComplete], AuditNoteRouter)
    .use('/reinscription', ReinscriptionRouter)
    .get('/dashboard', [Authenticate, InscriptionComplete], DashboardController.getDashboard)

export default router;
