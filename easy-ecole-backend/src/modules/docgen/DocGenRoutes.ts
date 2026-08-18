require("./models/_associations");
import { Router } from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import TypeRouter from "./routers/TypeRouter";
import TemplateRouter from "./routers/TemplateRouter";
import DocumentRouter from "./routers/DocumentRouter";
import CachetRouter from "./routers/CachetRouter";
import WorkflowRouter from "./routers/WorkflowRouter";
import SigningRouter from "./routers/SigningRouter";

import StudentDocumentRouter from "./routers/StudentDocumentRouter";

const router = Router();

// Ajouter middleware global d'authentification
router.use([Authenticate]);

router
  .use('/types', TypeRouter)
  .use('/templates', TemplateRouter)
  .use('/documents', DocumentRouter)
  .use('/cachets', CachetRouter)
  .use('/workflows', WorkflowRouter)
  .use('/signatures', SigningRouter)
  .use('/', StudentDocumentRouter);

export default router;
