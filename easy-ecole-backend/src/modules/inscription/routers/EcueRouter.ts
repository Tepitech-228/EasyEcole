import { Router } from "express";
import EcueController from "../controllers/EcueController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], EcueController.getAll.bind(EcueController));
router.get('/:id', [Authenticate], EcueController.get.bind(EcueController));
router.post('/', [Authenticate], EcueController.create.bind(EcueController));
router.put('/:id', [Authenticate], EcueController.update.bind(EcueController));
router.delete('/:id', [Authenticate], EcueController.delete.bind(EcueController));
router.get('/by-ue/:ueId', [Authenticate], EcueController.getByUe.bind(EcueController));

export default router;
