import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import BourseCampagneController from "../controllers/BourseCampagneController";

const router = express.Router();

router
    // ── Liste des étudiants éligibles ──
    .get('/eligibles',
        [Authenticate, CheckPermission('menu.bourses.campagne')],
        BourseCampagneController.getEligibles)

    // ── Attribution en masse ──
    .post('/attribuer',
        [Authenticate, CheckPermission('action.bourse.campagne.creer')],
        BourseCampagneController.bulkAttribuer)

export default router;
