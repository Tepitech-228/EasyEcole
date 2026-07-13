import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import SseController from "../controllers/SseController";

const router = express.Router();

router.get('/', [Authenticate], SseController.connect);

export default router;
