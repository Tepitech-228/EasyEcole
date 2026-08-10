import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import HierarchyController from "../controllers/HierarchyController";

const router = express.Router();

router.get('/', [Authenticate], HierarchyController.getTree);
router.get('/etudiants', [Authenticate], HierarchyController.getEtudiantsTree);
router.get('/presences', [Authenticate], HierarchyController.getPresencesTree);
router.get('/notes', [Authenticate], HierarchyController.getNotesTree);
router.get('/cahiers-texte', [Authenticate], HierarchyController.getCahiersTexteTree);
router.get('/enseignants', [Authenticate], HierarchyController.getEnseignantsTree);
router.get('/emplois-du-temps', [Authenticate], HierarchyController.getEmploisDuTempsTree);
router.get('/:type/:id/:anneeId', [Authenticate], HierarchyController.getDetails);

export default router;
