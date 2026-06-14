import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CategorieArticleController from "../controllers/CategorieArticleController";

const router = express.Router();
router
    .get('/', [Authenticate], CategorieArticleController.getAll)
    .get('/:id', [Authenticate], CategorieArticleController.get)
    .post('/', [Authenticate], CategorieArticleController.create)
    .put('/:id', [Authenticate], CategorieArticleController.update)
    .delete('/:id', [Authenticate], CategorieArticleController.delete)
export default router;
