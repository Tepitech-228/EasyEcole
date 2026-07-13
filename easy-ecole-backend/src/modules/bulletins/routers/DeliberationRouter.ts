import { Router } from "express";
import DeliberationController from "../controllers/DeliberationController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = Router();
const controller = new DeliberationController();

router.get('/deliberations', [Authenticate], controller.getAll.bind(controller));
router.get('/deliberations/stats', [Authenticate], controller.getStatistiques.bind(controller));
router.get('/deliberations/pv/:filename', [Authenticate], controller.telechargerPV.bind(controller));
router.get('/deliberations/:id', [Authenticate], controller.getOne.bind(controller));
router.get('/deliberations/:id/historique', [Authenticate], controller.getHistorique.bind(controller));
router.get('/deliberations/:id/suggestions', [Authenticate], controller.calculerSuggestions.bind(controller));
router.get('/deliberations/:deliberationId/dettes', [Authenticate], controller.getDettes.bind(controller));
router.post('/deliberations', [AuthInstitution, CheckPermission('action.evaluation.deliberation.creer')], controller.create.bind(controller));
router.put('/deliberations/:id', [AuthInstitution, CheckPermission('action.evaluation.deliberation.modifier')], controller.update.bind(controller));
router.delete('/deliberations/:id', [AuthInstitution, CheckPermission('action.evaluation.deliberation.supprimer')], controller.delete.bind(controller));
router.post('/deliberations/:id/charger-resultats', [AuthInstitution, CheckPermission('action.evaluation.deliberation.charger-resultats')], controller.chargerResultats.bind(controller));
router.put('/deliberations/:id/resultats/:resultatId', [AuthInstitution, CheckPermission('action.evaluation.deliberation.modifier-resultat')], controller.mettreAJourDecision.bind(controller));
router.put('/deliberations/:id/cloturer', [AuthInstitution, CheckPermission('action.evaluation.deliberation.cloturer')], controller.cloturer.bind(controller));
router.put('/deliberations/:id/publier', [AuthInstitution, CheckPermission('action.evaluation.deliberation.publier')], controller.publier.bind(controller));
router.put('/deliberations/:id/contester', [AuthInstitution, CheckPermission('action.evaluation.deliberation.contester')], controller.contester.bind(controller));
router.put('/deliberations/:id/verrouiller', [AuthInstitution, CheckPermission('action.evaluation.deliberation.verrouiller')], controller.verrouiller.bind(controller));
router.put('/deliberations/:id/deverrouiller', [AuthInstitution, CheckPermission('action.evaluation.deliberation.verrouiller')], controller.deverrouiller.bind(controller));
router.post('/deliberations/:id/generer-pv', [AuthInstitution, CheckPermission('action.evaluation.deliberation.generer-pv')], controller.genererPV.bind(controller));

export default router;
