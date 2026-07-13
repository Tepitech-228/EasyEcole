import { Router } from "express";
import JuryMembreController from "../controllers/JuryMembreController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

router.get('/', [Authenticate], JuryMembreController.getAll.bind(JuryMembreController));
router.get('/:id', [Authenticate], JuryMembreController.get.bind(JuryMembreController));
router.post('/', [Authenticate], JuryMembreController.create.bind(JuryMembreController));
router.delete('/:id', [Authenticate], JuryMembreController.delete.bind(JuryMembreController));

export default router;
