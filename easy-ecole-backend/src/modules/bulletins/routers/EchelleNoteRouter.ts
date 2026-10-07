import { Router } from "express";
import EchelleNoteController from "../controllers/EchelleNoteController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = Router();

router.get('/', [Authenticate], EchelleNoteController.getAll.bind(EchelleNoteController));
router.get('/:id', [Authenticate], EchelleNoteController.get.bind(EchelleNoteController));
router.post('/', [Authenticate, AuthInstitution], EchelleNoteController.create.bind(EchelleNoteController));
router.put('/:id', [Authenticate, AuthInstitution], EchelleNoteController.update.bind(EchelleNoteController));
router.delete('/:id', [Authenticate, AuthInstitution], EchelleNoteController.delete.bind(EchelleNoteController));

export default router;
