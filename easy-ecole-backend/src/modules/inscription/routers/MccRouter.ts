import { Router } from "express";
import MccController from "../controllers/MccController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], MccController.getAll.bind(MccController));
router.get('/:id', [Authenticate], MccController.get.bind(MccController));
router.post('/', [Authenticate], MccController.create.bind(MccController));
router.put('/:id', [Authenticate], MccController.update.bind(MccController));
router.delete('/:id', [Authenticate], MccController.delete.bind(MccController));
router.get('/by-ue/:ueId', [Authenticate], MccController.getByUe.bind(MccController));

export default router;
