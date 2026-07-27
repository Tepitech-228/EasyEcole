import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AssuranceController from "../controllers/AssuranceController";
const router = express.Router();
router
    .get('/', [Authenticate], AssuranceController.getAll)
    .get('/by-immobilisation/:immobilisationId', [Authenticate], AssuranceController.getByImmobilisation)
    .get('/:id', [Authenticate], AssuranceController.get)
    .post('/', [Authenticate], AssuranceController.create)
    .put('/:id', [Authenticate], AssuranceController.update)
    .delete('/:id', [Authenticate], AssuranceController.delete)
export default router;
