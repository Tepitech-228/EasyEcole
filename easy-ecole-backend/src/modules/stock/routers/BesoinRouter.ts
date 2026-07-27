import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import BesoinController from "../controllers/BesoinController";

const router = express.Router();
router
    .get('/', [Authenticate], BesoinController.getAll)
    .get('/by-article/:articleId', [Authenticate], BesoinController.getByArticle)
    .get('/:id', [Authenticate], BesoinController.get)
    .post('/', [Authenticate], BesoinController.create)
    .put('/:id', [Authenticate], BesoinController.update)
    .patch('/:id/approuver', [Authenticate], BesoinController.approuver)
    .patch('/:id/refuser', [Authenticate], BesoinController.refuser)
    .delete('/:id', [Authenticate], BesoinController.delete)
export default router;
