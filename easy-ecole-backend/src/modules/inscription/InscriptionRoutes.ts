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
import PaiementInscriptionRouter from "./routers/PaiementInscriptionRouter";
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
import ListePresenceRouter from "./routers/ListePresenceRouter";
import CahierDeTexteRouter from "./routers/CahierDeTexteRouter";
import BlocCahierDeTexteRouter from "./routers/BlocCahierDeTexteRouter";
import TypeNoteEvaluationRouter from "./routers/TypeNoteEvaluationRouter";
import ListeNoteEvaluationRouter from "./routers/ListeNoteEvaluationRouter";
import PointageRouter from "./routers/PointageRouter";

const router = express.Router();

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
    .use('/dossiersInscription', [Authenticate], DossierInscriptionRouter)
    .use('/anneesAcademiques', [Authenticate], AnneeAcademiqueRouter)
    .use('/cursusApprenant', [Authenticate], CursusApprenantRouter)
    .use('/sallesDeClasse', [Authenticate], SalleDeClasseRouter)
    .use('/chapitresCours', [Authenticate], ChapitreCoursRouter)
    .use('/ressources', [Authenticate], RessourceRouter)
    .use('/fichiersRessource', [Authenticate], FichierRessourceRouter)
    .use('/seances', [Authenticate], SeanceRouter)
    .use('/listesPresences', [Authenticate], ListePresenceRouter)
    .use('/presences', [Authenticate], PresenceRouter)
    .use('/presencesCoursParticipants', [Authenticate], PresenceCoursParticipantRouter)
    .use('/cahiersDeTexte', [Authenticate], CahierDeTexteRouter)
    .use('/blocsCahierDeTexte', [Authenticate], BlocCahierDeTexteRouter)
    .use('/typesNoteEvaluation', [Authenticate], TypeNoteEvaluationRouter)
    .use('/listesNoteEvaluation', [Authenticate], ListeNoteEvaluationRouter)
    .use('/pointages', [Authenticate], PointageRouter)

export default router;