import { Router } from "express";
import PassationController from "../controllers/PassationController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = Router();
const controller = new PassationController();

router.post('/passations/declencher', [AuthInstitution, CheckPermission('action.passation.declencher')], controller.declencher.bind(controller));
router.get('/passations', [Authenticate], controller.lister.bind(controller));

export default router;
