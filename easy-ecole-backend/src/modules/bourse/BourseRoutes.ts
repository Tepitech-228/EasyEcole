import "./models/_associations";
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import BourseConfigurationRouter from "./routers/BourseConfigurationRouter";
import BourseAttributionRouter from "./routers/BourseAttributionRouter";
import BourseCampagneRouter from "./routers/BourseCampagneRouter";

const router = express.Router();

router
    .use('/configurations', BourseConfigurationRouter)
    .use('/campagne', BourseCampagneRouter)
    .use('/', BourseAttributionRouter)

export default router;
