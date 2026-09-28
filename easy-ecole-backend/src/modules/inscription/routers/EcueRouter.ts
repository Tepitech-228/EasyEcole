import { Router } from "express";
import EcueController from "../controllers/EcueController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = Router();

router.get('/', [Authenticate], EcueController.getAll.bind(EcueController));
router.get('/:id', [Authenticate], EcueController.get.bind(EcueController));
router.post('/', [AuthInstitution, CheckPermission('action.inscription.ecue.creer')], EcueController.create.bind(EcueController));
router.put('/:id', [AuthInstitution, CheckPermission('action.inscription.ecue.modifier')], EcueController.update.bind(EcueController));
router.delete('/:id', [AuthInstitution, CheckPermission('action.inscription.ecue.supprimer')], EcueController.delete.bind(EcueController));
router.get('/by-ue/:ueId', [Authenticate], EcueController.getByUe.bind(EcueController));

export default router;
