import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CategorieImmobilisationController from "../controllers/CategorieImmobilisationController";
const router = express.Router();
router
    .get('/', [Authenticate], CategorieImmobilisationController.getAll)
    .get('/:id', [Authenticate], CategorieImmobilisationController.get)
    .post('/', [Authenticate], CategorieImmobilisationController.create)
    .put('/:id', [Authenticate], CategorieImmobilisationController.update)
    .delete('/:id', [Authenticate], CategorieImmobilisationController.delete)
export default router;
