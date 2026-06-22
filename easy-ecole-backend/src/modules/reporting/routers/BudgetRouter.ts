import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RapportBudgetController from "../controllers/RapportBudgetController";

const router = express.Router();

router
    .get('/', [Authenticate], RapportBudgetController.getAll)
    .get('/ecart', [Authenticate], RapportBudgetController.getEcart)

export default router;
