import { Router } from "express";
import BulletinController from "../controllers/BulletinController";
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = Router();
const controller = new BulletinController();

router.post('/bulletins/generer', [AuthInstitution], controller.generer.bind(controller));
router.get('/bulletins', [AuthEnseignant], controller.getAll.bind(controller));
router.get('/bulletins/mon-releve', [AuthEnseignant], controller.monReleve.bind(controller));
router.get('/bulletins/:id', [AuthEnseignant], controller.getOne.bind(controller));
router.put('/bulletins/:id', [AuthInstitution], controller.update.bind(controller));
router.put('/bulletins/:id/publier', [AuthInstitution], controller.publier.bind(controller));

export default router;
