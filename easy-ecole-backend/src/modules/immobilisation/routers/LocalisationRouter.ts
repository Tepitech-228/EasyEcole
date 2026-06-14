import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LocalisationController from "../controllers/LocalisationController";
const router = express.Router();
router
    .get('/', [Authenticate], LocalisationController.getAll)
    .get('/:id', [Authenticate], LocalisationController.get)
    .post('/', [Authenticate], LocalisationController.create)
    .put('/:id', [Authenticate], LocalisationController.update)
    .delete('/:id', [Authenticate], LocalisationController.delete)
export default router;
