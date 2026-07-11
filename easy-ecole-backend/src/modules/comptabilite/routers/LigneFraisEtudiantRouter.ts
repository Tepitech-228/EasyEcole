import express from "express"
import LigneFraisEtudiantController from "../controllers/LigneFraisEtudiantController"

const router = express.Router()

router
  .get('/', LigneFraisEtudiantController.getAll)
  .get('/by-dossier/:dossierEtudiantId', LigneFraisEtudiantController.getByDossier)
  .get('/:id', LigneFraisEtudiantController.get)
  .post('/', LigneFraisEtudiantController.create)
  .put('/:id', LigneFraisEtudiantController.update)
  .delete('/:id', LigneFraisEtudiantController.delete)

export default router
