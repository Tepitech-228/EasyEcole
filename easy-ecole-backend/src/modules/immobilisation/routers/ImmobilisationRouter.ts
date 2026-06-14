import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ImmobilisationController from "../controllers/ImmobilisationController";
const router = express.Router();
router
    .get('/', [Authenticate], ImmobilisationController.getAll)
    .get('/:id', [Authenticate], ImmobilisationController.get)
    .post('/', [Authenticate], ImmobilisationController.create)
    .put('/:id', [Authenticate], ImmobilisationController.update)
    .delete('/:id', [Authenticate], ImmobilisationController.delete)
export default router;
