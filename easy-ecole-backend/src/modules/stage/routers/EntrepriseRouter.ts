import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import EntrepriseController from "../controllers/EntrepriseController";

const router = express.Router();
router
    .get('/', [Authenticate], EntrepriseController.getAll)
    .get('/:id', [Authenticate], EntrepriseController.get)
    .post('/', [Authenticate], EntrepriseController.create)
    .put('/:id', [Authenticate], EntrepriseController.update)
    .delete('/:id', [Authenticate], EntrepriseController.delete)
export default router;
