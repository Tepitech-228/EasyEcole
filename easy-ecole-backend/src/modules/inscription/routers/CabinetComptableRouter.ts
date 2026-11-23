import express from "express";
import { CabinetComptableDashboardController } from "../controllers/CabinetComptableController";
import { AuthCabinetComptable } from "../../../core/middlewares/AuthCabinetComptable";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router();

router
    .get('/dashboard', [AuthCabinetComptable], CabinetComptableDashboardController.getDashboard)
    .get('/references', [AuthCabinetComptable, CheckPermission('action.inscription.bordereau.consulter')], CabinetComptableDashboardController.getReferences)
    .get('/historique', [AuthCabinetComptable], CabinetComptableDashboardController.getHistorique)

export default router;
