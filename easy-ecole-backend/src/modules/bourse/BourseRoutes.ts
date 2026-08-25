import "./models/_associations";
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import BourseConfigurationRouter from "./routers/BourseConfigurationRouter";
import BourseAttributionRouter from "./routers/BourseAttributionRouter";

const router = express.Router();

router
    .use('/configurations', BourseConfigurationRouter)
    .use('/', BourseAttributionRouter)

export default router;
