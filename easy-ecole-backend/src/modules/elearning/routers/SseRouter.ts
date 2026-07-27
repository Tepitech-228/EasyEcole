import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import SseController from "../controllers/SseController";

const router = express.Router();

router.get('/', [(req: any, res: any, next: any) => {
  if (!req.headers['authorization'] && req.query.token) {
    req.headers['authorization'] = `Bearer ${req.query.token}`;
  }
  next();
}, Authenticate], SseController.connect);

export default router;
