import { Router } from "express";
import DispenseController from "../controllers/DispenseController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], DispenseController.getAll.bind(DispenseController));
router.get('/:id', [Authenticate], DispenseController.get.bind(DispenseController));
router.post('/', [Authenticate], DispenseController.create.bind(DispenseController));
router.put('/:id', [Authenticate], DispenseController.update.bind(DispenseController));
router.delete('/:id', [Authenticate], DispenseController.delete.bind(DispenseController));

export default router;
