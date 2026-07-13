import { Router } from "express";
import EchelleNoteController from "../controllers/EchelleNoteController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], EchelleNoteController.getAll.bind(EchelleNoteController));
router.get('/:id', [Authenticate], EchelleNoteController.get.bind(EchelleNoteController));
router.post('/', [Authenticate], EchelleNoteController.create.bind(EchelleNoteController));
router.put('/:id', [Authenticate], EchelleNoteController.update.bind(EchelleNoteController));
router.delete('/:id', [Authenticate], EchelleNoteController.delete.bind(EchelleNoteController));

export default router;
