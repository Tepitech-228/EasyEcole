require("./models/_associations")
import express from "express";
import Authenticate from "../../core/middlewares/Authenticate";
import SiteRouter from "./routers/SiteRouter"
import BatimentRouter from "./routers/BatimentRouter"
import LocalisationRouter from "./routers/LocalisationRouter"
import DepartementRouter from "./routers/DepartementRouter"
import CategorieImmobilisationRouter from "./routers/CategorieImmobilisationRouter"
import ImmobilisationRouter from "./routers/ImmobilisationRouter"
import AcquisitionRouter from "./routers/AcquisitionRouter"
import AmortissementRouter from "./routers/AmortissementRouter"
import MaintenanceRouter from "./routers/MaintenanceRouter"
import MaintenanceProgrammeeRouter from "./routers/MaintenanceProgrammeeRouter"
import CessionRouter from "./routers/CessionRouter"

const router = express.Router();

router
    .use('/sites', [Authenticate], SiteRouter)
    .use('/batiments', [Authenticate], BatimentRouter)
    .use('/localisations', [Authenticate], LocalisationRouter)
    .use('/departements', [Authenticate], DepartementRouter)
    .use('/categories', [Authenticate], CategorieImmobilisationRouter)
    .use('/immobilisations', [Authenticate], ImmobilisationRouter)
    .use('/acquisitions', [Authenticate], AcquisitionRouter)
    .use('/amortissements', [Authenticate], AmortissementRouter)
    .use('/maintenances', [Authenticate], MaintenanceRouter)
    .use('/maintenances-programmees', [Authenticate], MaintenanceProgrammeeRouter)
    .use('/cessions', [Authenticate], CessionRouter)

export default router;
