import { Router } from "express";
import EquivalenceController from "../controllers/EquivalenceController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], EquivalenceController.getAll.bind(EquivalenceController));
router.get('/:id', [Authenticate], EquivalenceController.get.bind(EquivalenceController));
router.post('/', [Authenticate], EquivalenceController.create.bind(EquivalenceController));
router.put('/:id', [Authenticate], EquivalenceController.update.bind(EquivalenceController));
router.delete('/:id', [Authenticate], EquivalenceController.delete.bind(EquivalenceController));
router.get('/by-etudiant/:cursusApprenantId', [Authenticate], EquivalenceController.getByEtudiant.bind(EquivalenceController));

export default router;
