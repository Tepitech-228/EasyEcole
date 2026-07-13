import express from "express";
import RattrapageController from "../controllers/RattrapageController";

const router = express.Router();

router.get('/', RattrapageController.getAll);
router.get('/sessions', RattrapageController.getSessions);
router.get('/stats', RattrapageController.getStats);
router.get('/enseignant/prochain-cours', RattrapageController.getProchainCoursEnseignant);
router.get('/:id', RattrapageController.get);
router.post('/', RattrapageController.create);
router.post('/assigner-auto', RattrapageController.assignerAuto);
router.post('/notifier', RattrapageController.notifierEtudiants);
router.put('/notes', RattrapageController.saveNotes);
router.put('/:id', RattrapageController.update);
router.delete('/:id', RattrapageController.delete);

export default router;
