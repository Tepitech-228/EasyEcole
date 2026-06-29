require("./models/_associations")
import express from "express";
import AuthRouter from "./routers/AuthRouter";
import UtilisateurRouter from "./routers/UtilisateurRouter";
import ApprenantRouter from "./routers/ApprenantRouter";
import Authenticate from "../../core/middlewares/Authenticate";
import InstitutionRouter from "./routers/InstitutionRouter";
import CaissierBanqueRouter from "./routers/CaissierBanqueRouter";
import EnseignantRouter from "./routers/EnseignantRouter";
import ComiteOrientationRouter from "./routers/ComiteOrientationRouter";
import PermissionRouter from "./routers/PermissionRouter";
import RoleRouter from "./routers/RoleRouter";

const router = express.Router();

router
    .use('/', AuthRouter)
    .use('/utilisateurs', [Authenticate], UtilisateurRouter)
    .use('/apprenants', [Authenticate], ApprenantRouter)
    .use('/institutions', [Authenticate], InstitutionRouter)
    .use('/caissiersBanque', [Authenticate], CaissierBanqueRouter)
    .use('/enseignants', [Authenticate], EnseignantRouter)
    .use('/comite-orientation', [Authenticate], ComiteOrientationRouter)
    .use('/permissions', [Authenticate], PermissionRouter)
    .use('/roles', [Authenticate], RoleRouter)

export default router;