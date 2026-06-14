import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import NoteStageController from "../controllers/NoteStageController";

const router = express.Router();
router
    .get('/', [Authenticate], NoteStageController.getAll)
    .get('/:id', [Authenticate], NoteStageController.get)
    .post('/', [Authenticate], NoteStageController.create)
    .put('/:id', [Authenticate], NoteStageController.update)
    .delete('/:id', [Authenticate], NoteStageController.delete)
export default router;
