import express from "express";
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines";
import Authenticate from "../../../core/middlewares/Authenticate";
import RhTauxHoraireEnseignantController from "../controllers/RhTauxHoraireEnseignantController";

const router = express.Router();

router
  .get("/", [Authenticate, AuthRessourcesHumaines], RhTauxHoraireEnseignantController.getAll)
  .get("/options", [Authenticate, AuthRessourcesHumaines], RhTauxHoraireEnseignantController.getOptions)
  .post("/", [Authenticate, AuthRessourcesHumaines], RhTauxHoraireEnseignantController.save)
  .delete("/:id", [Authenticate, AuthRessourcesHumaines], RhTauxHoraireEnseignantController.delete);

export default router;
