import { Router } from "express";
import SessionExamenController from "../controllers/SessionExamenController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthAdmin } from "../../../core/middlewares/AuthAdmin";

const router = Router();

router.get('/', [Authenticate], SessionExamenController.getAll.bind(SessionExamenController));
router.get('/:id', [Authenticate], SessionExamenController.get.bind(SessionExamenController));
router.post('/', [Authenticate, AuthAdmin], SessionExamenController.create.bind(SessionExamenController));
router.put('/:id', [Authenticate, AuthAdmin], SessionExamenController.update.bind(SessionExamenController));
router.delete('/:id', [Authenticate, AuthAdmin], SessionExamenController.delete.bind(SessionExamenController));
router.post('/:id/publier', [Authenticate, AuthAdmin], SessionExamenController.publier.bind(SessionExamenController));
router.get('/by-classe/:classeId', [Authenticate], SessionExamenController.getByClasse.bind(SessionExamenController));
router.post('/creer-paire', [Authenticate, AuthAdmin], SessionExamenController.creerPaire.bind(SessionExamenController));
router.get('/:id/correcteurs', [Authenticate], SessionExamenController.getCorrecteurs.bind(SessionExamenController));
router.put('/:id/correcteurs', [Authenticate, AuthAdmin], SessionExamenController.saveCorrecteurs.bind(SessionExamenController));

export default router;
