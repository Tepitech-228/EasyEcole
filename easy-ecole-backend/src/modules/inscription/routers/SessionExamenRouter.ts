import { Router } from "express";
import SessionExamenController from "../controllers/SessionExamenController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], SessionExamenController.getAll.bind(SessionExamenController));
router.get('/:id', [Authenticate], SessionExamenController.get.bind(SessionExamenController));
router.post('/', [Authenticate], SessionExamenController.create.bind(SessionExamenController));
router.put('/:id', [Authenticate], SessionExamenController.update.bind(SessionExamenController));
router.delete('/:id', [Authenticate], SessionExamenController.delete.bind(SessionExamenController));
router.get('/by-classe/:classeId', [Authenticate], SessionExamenController.getByClasse.bind(SessionExamenController));

export default router;
