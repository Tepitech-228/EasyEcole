import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import BourseCampagneController from "../controllers/BourseCampagneController";

const router = express.Router();

router
    // ── Liste des niveaux d'études ──
    .get('/niveaux',
        [Authenticate, CheckPermission('menu.bourses.campagne')],
        BourseCampagneController.getNiveaux)

    // ── Liste des étudiants éligibles (filtrés par niveau) ──
    .get('/eligibles',
        [Authenticate, CheckPermission('menu.bourses.campagne')],
        BourseCampagneController.getEligibles)

    // ── Attribution en masse par niveau ──
    .post('/attribuer',
        [Authenticate, CheckPermission('action.bourse.campagne.creer')],
        BourseCampagneController.bulkAttribuer)

export default router;
