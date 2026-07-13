import express from "express"
import RhContratEnseignantController from "../controllers/RhContratEnseignantController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"

const router = express.Router()

router
  .get('/', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.getAll)
  .get('/by-employe/:employeId', [Authenticate], RhContratEnseignantController.getByEmploye)
  .get('/:id', [Authenticate], RhContratEnseignantController.get)
  .post('/', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.create)
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.update)
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.delete)
  .patch('/:id/resilier', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.resilier)
  .patch('/:id/activer', [Authenticate, AuthRessourcesHumaines], RhContratEnseignantController.activer)

export default router
