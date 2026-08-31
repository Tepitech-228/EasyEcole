import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import { cache } from "../../../core/middlewares/CacheMiddleware";
import SurveillantDashboardController from "../controllers/SurveillantDashboardController";

const router = express.Router();

router
  .get('/dashboard', [Authenticate, cache(60)], SurveillantDashboardController.getDashboard)
  .get('/discipline-du-jour', [Authenticate, cache(30)], SurveillantDashboardController.getDisciplineDuJour)
  .get('/presences-du-jour', [Authenticate, cache(30)], SurveillantDashboardController.getPresencesDuJour)
  .post('/incidents', [Authenticate], SurveillantDashboardController.createIncident)
  .put('/incidents/:id', [Authenticate], SurveillantDashboardController.updateIncident)

export default router;