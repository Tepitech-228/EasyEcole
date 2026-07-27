require("./models/_associations")
import express from "express";
import RhDepartementRouter from "./routers/RhDepartementRouter"
import RhTypeContratRouter from "./routers/RhTypeContratRouter"
import RhPosteRouter from "./routers/RhPosteRouter"
import RhEmployeRouter from "./routers/RhEmployeRouter"
import RhOffreEmploiRouter from "./routers/RhOffreEmploiRouter"
import RhCandidatureRouter from "./routers/RhCandidatureRouter"
import RhEntretienRouter from "./routers/RhEntretienRouter"
import RhFormationRouter from "./routers/RhFormationRouter"
import RhParticipationFormationRouter from "./routers/RhParticipationFormationRouter"
import RhCritereEvaluationRouter from "./routers/RhCritereEvaluationRouter"
import RhFicheEvaluationRouter from "./routers/RhFicheEvaluationRouter"
import RhEvaluationCritereRouter from "./routers/RhEvaluationCritereRouter"
import RhRubriquePaieRouter from "./routers/RhRubriquePaieRouter"
import RhPeriodePaieRouter from "./routers/RhPeriodePaieRouter"
import RhBulletinPaieRouter from "./routers/RhBulletinPaieRouter"
import RhLigneBulletinRouter from "./routers/RhLigneBulletinRouter"
import RhPrestationEnseignantRouter from "./routers/RhPrestationEnseignantRouter"
import RhContratEnseignantRouter from "./routers/RhContratEnseignantRouter"
import RhPlanningPersonnelRouter from "./routers/RhPlanningPersonnelRouter"
import RhCategorieProfessionnelleRouter from "./routers/RhCategorieProfessionnelleRouter"
import RhGrilleSalarialeRouter from "./routers/RhGrilleSalarialeRouter"
import RhHeureSupplementaireRouter from "./routers/RhHeureSupplementaireRouter"
import RhPretRouter from "./routers/RhPretRouter"
import RhRemboursementPretRouter from "./routers/RhRemboursementPretRouter"
import RhReportingRouter from "./routers/RhReportingRouter"
import RhPrestataireRouter from "./routers/RhPrestataireRouter"
import RhIndemnitePrestataireRouter from "./routers/RhIndemnitePrestataireRouter"
import RhDemandeCongeRouter from "./routers/RhDemandeCongeRouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/departements', [Authenticate], RhDepartementRouter)
    .use('/types-contrat', [Authenticate], RhTypeContratRouter)
    .use('/postes', [Authenticate], RhPosteRouter)
    .use('/employes', [Authenticate], RhEmployeRouter)
    .use('/offres-emploi', [Authenticate], RhOffreEmploiRouter)
    .use('/candidatures', [Authenticate], RhCandidatureRouter)
    .use('/entretiens', [Authenticate], RhEntretienRouter)
    .use('/formations', [Authenticate], RhFormationRouter)
    .use('/participations-formation', [Authenticate], RhParticipationFormationRouter)
    .use('/criteres-evaluation', [Authenticate], RhCritereEvaluationRouter)
    .use('/fiches-evaluation', [Authenticate], RhFicheEvaluationRouter)
    .use('/evaluations-criteres', [Authenticate], RhEvaluationCritereRouter)
    .use('/rubriques-paie', [Authenticate], RhRubriquePaieRouter)
    .use('/periodes-paie', [Authenticate], RhPeriodePaieRouter)
    .use('/bulletins-paie', [Authenticate], RhBulletinPaieRouter)
    .use('/lignes-bulletin', [Authenticate], RhLigneBulletinRouter)
    .use('/prestations-enseignant', [Authenticate], RhPrestationEnseignantRouter)
    .use('/contrats-enseignant', [Authenticate], RhContratEnseignantRouter)
    .use('/planning-personnel', [Authenticate], RhPlanningPersonnelRouter)
    .use('/categories-professionnelles', [Authenticate], RhCategorieProfessionnelleRouter)
    .use('/grilles-salariales', [Authenticate], RhGrilleSalarialeRouter)
    .use('/heures-supplementaires', [Authenticate], RhHeureSupplementaireRouter)
    .use('/prets', [Authenticate], RhPretRouter)
    .use('/remboursements-pret', [Authenticate], RhRemboursementPretRouter)
    .use('/reportings', [Authenticate], RhReportingRouter)
    .use('/prestataires', [Authenticate], RhPrestataireRouter)
    .use('/indemnites-prestataires', [Authenticate], RhIndemnitePrestataireRouter)
    .use('/demandes-conge', [Authenticate], RhDemandeCongeRouter)

export default router;
