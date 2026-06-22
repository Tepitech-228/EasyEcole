require("./models/_associations")
import express from "express"
import CoursEnLigneRouter from "./routers/CoursEnLigneRouter"
import ModuleRouter from "./routers/ModuleRouter"
import SupportRouter from "./routers/SupportRouter"
import ChatRouter from "./routers/ChatRouter"
import NotificationRouter from "./routers/NotificationRouter"
import Authenticate from "../../core/middlewares/Authenticate"

const router = express.Router()

router
    .use('/cours', [Authenticate], CoursEnLigneRouter)
    .use('/modules', [Authenticate], ModuleRouter)
    .use('/supports', [Authenticate], SupportRouter)
    .use('/chat', [Authenticate], ChatRouter)
    .use('/notifications', [Authenticate], NotificationRouter)

export default router
