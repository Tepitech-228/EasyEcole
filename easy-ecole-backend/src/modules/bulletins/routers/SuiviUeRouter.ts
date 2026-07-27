import { Router } from "express";
import SuiviUeController from "../controllers/SuiviUeController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();
const controller = new SuiviUeController();

router.get('/cursus-apprenant/:id/suivi-ue', [Authenticate], controller.getSuivi.bind(controller));
router.get('/cursus-apprenant/mon-suivi', [Authenticate], controller.getMonSuivi.bind(controller));
router.get('/cursus-apprenant/:id/dettes', [Authenticate], controller.getDettes.bind(controller));
router.get('/cursus-apprenant/:id/dettes-actives', [Authenticate], controller.getDettesActives.bind(controller));
router.get('/cursus-apprenant/:id/eligibilite-passation', [Authenticate], controller.verifierEligibilite.bind(controller));
router.put('/dettes/:detteId/resorber', [Authenticate], controller.resorberDette.bind(controller));

export default router;
