import { Router } from "express";
import DeliberationController from "../controllers/DeliberationController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = Router();
const controller = new DeliberationController();

router.get('/deliberations', [Authenticate], controller.getAll.bind(controller));
router.get('/deliberations/:id', [Authenticate], controller.getOne.bind(controller));
router.post('/deliberations', [AuthInstitution, CheckPermission('action.evaluation.deliberation.creer')], controller.create.bind(controller));
router.put('/deliberations/:id', [AuthInstitution, CheckPermission('action.evaluation.deliberation.modifier')], controller.update.bind(controller));
router.delete('/deliberations/:id', [AuthInstitution, CheckPermission('action.evaluation.deliberation.supprimer')], controller.delete.bind(controller));
router.post('/deliberations/:id/charger-resultats', [AuthInstitution, CheckPermission('action.evaluation.deliberation.charger-resultats')], controller.chargerResultats.bind(controller));
router.put('/deliberations/:id/resultats/:resultatId', [AuthInstitution, CheckPermission('action.evaluation.deliberation.modifier-resultat')], controller.mettreAJourDecision.bind(controller));
router.put('/deliberations/:id/cloturer', [AuthInstitution, CheckPermission('action.evaluation.deliberation.cloturer')], controller.cloturer.bind(controller));

export default router;
