import { Router } from "express";
import RegleEvaluationController from "../controllers/RegleEvaluationController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], RegleEvaluationController.getAll.bind(RegleEvaluationController));
router.get('/:id', [Authenticate], RegleEvaluationController.get.bind(RegleEvaluationController));
router.post('/', [Authenticate], RegleEvaluationController.create.bind(RegleEvaluationController));
router.put('/:id', [Authenticate], RegleEvaluationController.update.bind(RegleEvaluationController));
router.delete('/:id', [Authenticate], RegleEvaluationController.delete.bind(RegleEvaluationController));

export default router;
