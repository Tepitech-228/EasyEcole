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
import ProgressionApprenantRouter from "./routers/ProgressionApprenantRouter"
import Authenticate from "../../core/middlewares/Authenticate"
import { InscriptionComplete } from "../../core/middlewares/InscriptionComplete"

const router = express.Router()

router
    .use('/cours', [Authenticate, InscriptionComplete], CoursEnLigneRouter)
    .use('/modules', [Authenticate, InscriptionComplete], ModuleRouter)
    .use('/supports', [Authenticate, InscriptionComplete], SupportRouter)
    .use('/chat', [Authenticate], ChatRouter)
    .use('/notifications', [Authenticate], NotificationRouter)
    .use('/devoirs', [Authenticate, InscriptionComplete], DevoirRouter)
    .use('/quiz', [Authenticate, InscriptionComplete], QuizRouter)
    .use('/progression', [Authenticate, InscriptionComplete], ProgressionRouter)
    .use('/progression-apprenant', [Authenticate, InscriptionComplete], ProgressionApprenantRouter)
    .use('/certificats', [Authenticate, InscriptionComplete], CertificatRouter)

export default router
