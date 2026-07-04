require("./models/_associations");
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import DocumentGedRouter from "./routers/DocumentGedRouter";
import FolderRouter from "./routers/FolderRouter";
import SessionGedRouter from "./routers/SessionGedRouter";

const router = express.Router();

router
    .use('/documents', [Authenticate], DocumentGedRouter)
    .use('/folders', [Authenticate], FolderRouter)
    .use('/sessions', [Authenticate], SessionGedRouter)

export default router;
