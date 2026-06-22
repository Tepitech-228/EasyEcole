import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportNotesController from "../controllers/RapportNotesController";

const router = express.Router();

router
    .get('/moyennes', [Authenticate], RapportNotesController.getMoyennes)
    .get('/reussite', [Authenticate], RapportNotesController.getReussite)

export default router;
