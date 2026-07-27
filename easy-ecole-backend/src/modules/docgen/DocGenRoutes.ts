require("./models/_associations");
import { Router } from "express";
import TypeRouter from "./routers/TypeRouter";
import TemplateRouter from "./routers/TemplateRouter";
import DocumentRouter from "./routers/DocumentRouter";
import CachetRouter from "./routers/CachetRouter";
import WorkflowRouter from "./routers/WorkflowRouter";
import SigningRouter from "./routers/SigningRouter";

const router = Router();

router
  .use('/types', TypeRouter)
  .use('/templates', TemplateRouter)
  .use('/documents', DocumentRouter)
  .use('/cachets', CachetRouter)
  .use('/workflows', WorkflowRouter)
  .use('/signatures', SigningRouter);

export default router;
