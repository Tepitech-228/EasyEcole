import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import { cache } from "../../../core/middlewares/CacheMiddleware";
import SurveillantDashboardController from "../controllers/SurveillantDashboardController";

const router = express.Router();

router
  .get('/dashboard', [Authenticate, cache(60)], SurveillantDashboardController.getDashboard)

export default router;