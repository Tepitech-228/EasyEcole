import express from "express"

import CaissierBanqueController from "../controllers/CaissierBanqueController"
import { AuthCaissierBanque } from "../../../core/middlewares/AuthCaissierBanque";

const router = express.Router()

router
    .get('/', CaissierBanqueController.getAllCaissierBanques)
    .get('/:id', CaissierBanqueController.getCaissierBanque)
    .put('/', [AuthCaissierBanque], CaissierBanqueController.updateCaissierBanque)
    .delete('/', [AuthCaissierBanque], CaissierBanqueController.deleteCaissierBanque)
    .get('/statistics/count', [AuthCaissierBanque], CaissierBanqueController.getCount)

export default router