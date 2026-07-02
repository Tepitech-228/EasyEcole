import { Router } from "express";
import UniteEnseignementController from "../controllers/UniteEnseignementController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], UniteEnseignementController.getAll.bind(UniteEnseignementController));
router.get('/:id', [Authenticate], UniteEnseignementController.get.bind(UniteEnseignementController));
router.post('/', [Authenticate], UniteEnseignementController.create.bind(UniteEnseignementController));
router.put('/:id', [Authenticate], UniteEnseignementController.update.bind(UniteEnseignementController));
router.delete('/:id', [Authenticate], UniteEnseignementController.delete.bind(UniteEnseignementController));

export default router;
