import express from "express"
import RhDemandeCongeController from "../controllers/RhDemandeCongeController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  .get('/', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.getAll)
  .get('/count', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.getCount)
  .get('/soldes', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.getSoldesAll)
  .get('/soldes/:employeId', [Authenticate], RhDemandeCongeController.getSolde)
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.get)
  .post('/', [Authenticate], RhDemandeCongeController.create)
  .post('/:id/valider', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.valider)
  .post('/:id/refuser', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.refuser)
  .post('/initialiser-solde', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.initialiserSolde)
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.update)
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhDemandeCongeController.delete)

export default router
