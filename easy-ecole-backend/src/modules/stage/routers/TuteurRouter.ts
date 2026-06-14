import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import TuteurController from "../controllers/TuteurController";

const router = express.Router();
router
    .get('/', [Authenticate], TuteurController.getAll)
    .get('/:id', [Authenticate], TuteurController.get)
    .post('/', [Authenticate], TuteurController.create)
    .put('/:id', [Authenticate], TuteurController.update)
    .delete('/:id', [Authenticate], TuteurController.delete)
export default router;
