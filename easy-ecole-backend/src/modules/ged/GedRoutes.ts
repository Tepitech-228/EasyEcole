require("./models/_associations");
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import DocumentGedRouter from "./routers/DocumentGedRouter";
import FolderRouter from "./routers/FolderRouter";
import SessionGedRouter from "./routers/SessionGedRouter";
import AdminGedRouter from "./routers/AdminGedRouter";
import ProcessusGenerateurRouter from "./routers/ProcessusGenerateurRouter";
import StorageConfigRouter from "./routers/StorageConfigRouter";
import AcademicTreeController from "./controllers/AcademicTreeController";
import CourrierRouter from "./routers/CourrierRouter";
import FolderAutoRouter from "./routers/FolderAutoRouter";
import DashboardGedRouter from "./routers/DashboardGedRouter";
import NotificationGedRouter from "./routers/NotificationGedRouter";

const router = express.Router();

router
    .use('/documents', [Authenticate], DocumentGedRouter)
    .use('/folders', [Authenticate], FolderRouter)
    .use('/sessions', [Authenticate], SessionGedRouter)
    .use('/processus', [Authenticate], ProcessusGenerateurRouter)
    .use('/storage', [Authenticate], StorageConfigRouter)
    .use('/admin', [Authenticate], AdminGedRouter)
    .use('/folders-auto', [Authenticate], FolderAutoRouter)
    .use('/courrier', [Authenticate], CourrierRouter)
    .use('/dashboard', [Authenticate], DashboardGedRouter)
    .use('/notifications', [Authenticate], NotificationGedRouter)
        /**
     * @openapi
     * /academic-tree:
     *   get:
     *     tags: [GED]
     *     summary: GET /academic-tree
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/academic-tree', [Authenticate], AcademicTreeController.getTree)

export default router;
