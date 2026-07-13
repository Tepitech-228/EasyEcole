import { Router } from "express";
import AuditNoteController from "../controllers/AuditNoteController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], AuditNoteController.getAll.bind(AuditNoteController));
router.get('/by-note/:noteEvaluationId', [Authenticate], AuditNoteController.getByNote.bind(AuditNoteController));

export default router;
