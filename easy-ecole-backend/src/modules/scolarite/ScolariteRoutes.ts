require("./models/_associations")
import express from "express";
import DemandeDocumentRouter from "./routers/DemandeDocumentRouter"
import DocumentDelivreRouter from "./routers/DocumentDelivreRouter"
import ReclamationRouter from "./routers/ReclamationRouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/demandesDocument', [Authenticate], DemandeDocumentRouter)
    .use('/typesDocument', [Authenticate], DocumentDelivreRouter)
    .use('/reclamations', [Authenticate], ReclamationRouter)

export default router;
