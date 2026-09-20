import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import RattrapageComiteVoteController from "../controllers/RattrapageComiteVoteController";

const router = express.Router();

router.use([Authenticate]);

router
  .get("/demandes", RattrapageComiteVoteController.listerDemandes)
  .get("/demandes/:id", RattrapageComiteVoteController.detailDemande)
  .post("/demandes/:id/decider", RattrapageComiteVoteController.decider)
  .get("/demandes/:id/votes", RattrapageComiteVoteController.listerVotes);

export default router;