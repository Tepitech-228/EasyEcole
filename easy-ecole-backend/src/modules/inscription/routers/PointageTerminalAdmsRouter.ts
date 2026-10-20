import express from "express";
import PointageTerminalController from "../controllers/PointageTerminalController";

const router = express.Router();

router
    .get("/cdata", PointageTerminalController.optionsAdms)
    .post("/cdata", express.text({ type: "text/plain", limit: "1mb" }), PointageTerminalController.recevoirDonneesAdms)
    .get("/getrequest", PointageTerminalController.confirmerCommandeAdms)
    .route("/devicecmd")
    .get(PointageTerminalController.confirmerCommandeAdms)
    .post(PointageTerminalController.confirmerCommandeAdms);

router
    .get("/test", PointageTerminalController.confirmerCommandeAdms)
    .post("/test", PointageTerminalController.confirmerCommandeAdms);

export default router;
