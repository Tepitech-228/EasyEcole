import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import HierarchyController from "../controllers/HierarchyController";

const router = express.Router();

router.get('/', [Authenticate], HierarchyController.getTree);
router.get('/:type/:id/:anneeId', [Authenticate], HierarchyController.getDetails);

export default router;
