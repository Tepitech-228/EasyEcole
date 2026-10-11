import { Router } from "express";
import AuditNoteController from "../controllers/AuditNoteController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { RefuserRoles } from "../../../core/middlewares/RefuserRoles";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

const router = Router();

// Journal d'audit des notes : réservé au personnel (ni PARENT ni APPRENANT).
router.use(RefuserRoles(RolesUtilisateur.PARENT, RolesUtilisateur.APPRENANT));

router.get('/', [Authenticate], AuditNoteController.getAll.bind(AuditNoteController));
router.get('/by-note/:noteEvaluationId', [Authenticate], AuditNoteController.getByNote.bind(AuditNoteController));

export default router;
