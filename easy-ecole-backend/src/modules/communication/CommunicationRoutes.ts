require("./models/_associations")
import express from "express";
import SuggestionRouter from "./routers/SuggestionRouter"
import CommunicationRouter from "./routers/CommunicationRouter"
import ActualiteRouter from "./routers/ActualiteRouter"
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use('/suggestions', [Authenticate], SuggestionRouter)
    .use('/communications', [Authenticate], CommunicationRouter)
    .use('/actualites', [Authenticate], ActualiteRouter)

export default router;
