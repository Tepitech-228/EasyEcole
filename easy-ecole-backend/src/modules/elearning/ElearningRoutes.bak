require("./models/_associations")
import express from "express"
import CoursEnLigneRouter from "./routers/CoursEnLigneRouter"
import ModuleRouter from "./routers/ModuleRouter"
import SupportRouter from "./routers/SupportRouter"
import ChatRouter from "./routers/ChatRouter"
import NotificationRouter from "./routers/NotificationRouter"
import DevoirRouter from "./routers/DevoirRouter"
import QuizRouter from "./routers/QuizRouter"
import ProgressionRouter from "./routers/ProgressionRouter"
import CertificatRouter from "./routers/CertificatRouter"
import Authenticate from "../../core/middlewares/Authenticate"

const router = express.Router()

router
    .use('/cours', [Authenticate], CoursEnLigneRouter)
    .use('/modules', [Authenticate], ModuleRouter)
    .use('/supports', [Authenticate], SupportRouter)
    .use('/chat', [Authenticate], ChatRouter)
    .use('/notifications', [Authenticate], NotificationRouter)
    .use('/devoirs', [Authenticate], DevoirRouter)
    .use('/quiz', [Authenticate], QuizRouter)
    .use('/progression', [Authenticate], ProgressionRouter)
    .use('/certificats', [Authenticate], CertificatRouter)

export default router
