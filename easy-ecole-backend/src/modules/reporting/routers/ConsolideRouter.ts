import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportConsolideController from "../controllers/RapportConsolideController";

const router = express.Router();

router
    .get('/dashboard', [Authenticate], RapportConsolideController.getDashboard)

export default router;
