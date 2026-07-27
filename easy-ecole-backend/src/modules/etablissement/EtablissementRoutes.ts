require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import EtablissementRouter from "./routers/EtablissementRouter"

const router = express.Router();

router
    .use('/', [Authenticate], EtablissementRouter)

export default router;
