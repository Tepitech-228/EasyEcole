import { Router } from "express";
import SessionExamenController from "../controllers/SessionExamenController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = Router();

router.get('/', [Authenticate], SessionExamenController.getAll.bind(SessionExamenController));
router.get('/:id', [Authenticate], SessionExamenController.get.bind(SessionExamenController));
router.post('/', [AuthInstitution, CheckPermission('action.inscription.session.creer')], SessionExamenController.create.bind(SessionExamenController));
router.put('/:id', [AuthInstitution, CheckPermission('action.inscription.session.modifier')], SessionExamenController.update.bind(SessionExamenController));
router.delete('/:id', [AuthInstitution, CheckPermission('action.inscription.session.supprimer')], SessionExamenController.delete.bind(SessionExamenController));
router.get('/by-classe/:classeId', [Authenticate], SessionExamenController.getByClasse.bind(SessionExamenController));
router.post('/creer-paire', [AuthInstitution, CheckPermission('action.inscription.session.creer')], SessionExamenController.creerPaire.bind(SessionExamenController));
router.get('/:id/correcteurs', [Authenticate], SessionExamenController.getCorrecteurs.bind(SessionExamenController));
router.put('/:id/correcteurs', [AuthInstitution, CheckPermission('action.inscription.session.modifier')], SessionExamenController.saveCorrecteurs.bind(SessionExamenController));

export default router;
