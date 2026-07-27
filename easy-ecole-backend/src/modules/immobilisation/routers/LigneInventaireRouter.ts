import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LigneInventaireController from "../controllers/LigneInventaireController";
const router = express.Router();
router
    .get('/', [Authenticate], LigneInventaireController.getAll)
    .get('/by-inventaire/:inventaireId', [Authenticate], LigneInventaireController.getByInventaire)
    .get('/:id', [Authenticate], LigneInventaireController.get)
    .post('/', [Authenticate], LigneInventaireController.create)
    .put('/:id', [Authenticate], LigneInventaireController.update)
    .delete('/:id', [Authenticate], LigneInventaireController.delete)
export default router;
