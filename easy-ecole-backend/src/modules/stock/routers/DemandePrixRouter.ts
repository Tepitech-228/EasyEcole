import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import DemandePrixController from "../controllers/DemandePrixController";

const router = express.Router();
router
    .get('/', [Authenticate], DemandePrixController.getAll)
    .get('/by-article/:articleId', [Authenticate], DemandePrixController.getByArticle)
    .get('/by-fournisseur/:fournisseurId', [Authenticate], DemandePrixController.getByFournisseur)
    .get('/:id', [Authenticate], DemandePrixController.get)
    .post('/', [Authenticate], DemandePrixController.create)
    .put('/:id', [Authenticate], DemandePrixController.update)
    .patch('/:id/retenir', [Authenticate], DemandePrixController.retenir)
    .delete('/:id', [Authenticate], DemandePrixController.delete)
export default router;
