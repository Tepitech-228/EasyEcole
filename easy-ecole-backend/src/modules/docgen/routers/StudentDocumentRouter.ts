import { Router } from "express";
import StudentDocumentController from "../controllers/StudentDocumentController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = Router();

router.post('/student/generate', [Authenticate, AuthApprenant], StudentDocumentController.generateMyDocument);

router.get('/student/documents', [Authenticate, AuthApprenant], StudentDocumentController.getMyDocuments);

export default router;
