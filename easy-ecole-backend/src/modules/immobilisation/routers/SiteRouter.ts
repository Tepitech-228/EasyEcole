import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import SiteController from "../controllers/SiteController";
const router = express.Router();
router
    .get('/', [Authenticate], SiteController.getAll)
    .get('/:id', [Authenticate], SiteController.get)
    .post('/', [Authenticate], SiteController.create)
    .put('/:id', [Authenticate], SiteController.update)
    .delete('/:id', [Authenticate], SiteController.delete)
export default router;
