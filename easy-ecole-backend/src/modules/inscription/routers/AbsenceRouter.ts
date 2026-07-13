import { Router } from "express";
import AbsenceController from "../controllers/AbsenceController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], AbsenceController.getAll.bind(AbsenceController));
router.get('/:id', [Authenticate], AbsenceController.get.bind(AbsenceController));
router.post('/', [Authenticate], AbsenceController.create.bind(AbsenceController));
router.put('/:id', [Authenticate], AbsenceController.update.bind(AbsenceController));
router.delete('/:id', [Authenticate], AbsenceController.delete.bind(AbsenceController));
router.get('/by-note/:noteEvaluationId', [Authenticate], AbsenceController.getByNoteEvaluation.bind(AbsenceController));

export default router;
