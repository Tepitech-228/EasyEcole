import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ArticleController from "../controllers/ArticleController";

const router = express.Router();
router
    .get('/', [Authenticate], ArticleController.getAll)
    .get('/:id', [Authenticate], ArticleController.get)
    .post('/', [Authenticate], ArticleController.create)
    .put('/:id', [Authenticate], ArticleController.update)
    .delete('/:id', [Authenticate], ArticleController.delete)
export default router;
