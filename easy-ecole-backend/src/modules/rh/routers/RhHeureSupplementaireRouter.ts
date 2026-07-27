import express from "express"
import RhHeureSupplementaireController from "../controllers/RhHeureSupplementaireController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.getAll)
  .get('/by-employe/:employeId', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.getByEmploye)
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.get)
  .post('/', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.create)
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.update)
  .patch('/:id/valider', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.valider)
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhHeureSupplementaireController.delete)

export default router
