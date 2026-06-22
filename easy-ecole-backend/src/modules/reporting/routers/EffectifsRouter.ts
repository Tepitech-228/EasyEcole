import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportEffectifsController from "../controllers/RapportEffectifsController";

const router = express.Router();

router
    .get('/', [Authenticate], RapportEffectifsController.getAll)
    .get('/summary', [Authenticate], RapportEffectifsController.getSummary)

export default router;
