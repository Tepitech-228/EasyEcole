require("./models/_associations");
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import DocumentGedRouter from "./routers/DocumentGedRouter";

const router = express.Router();

router
    .use('/documents', [Authenticate], DocumentGedRouter)

export default router;
