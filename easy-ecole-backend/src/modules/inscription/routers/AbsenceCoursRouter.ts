import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate"
import AbsenceCoursController from "../controllers/AbsenceCoursController"

const router = express.Router()
const controller = new AbsenceCoursController()

router.get('/absences-cours/etudiant/:cursusApprenantId', [Authenticate], controller.getAbsencesByEtudiant.bind(controller))
router.get('/absences-cours/etudiant/:cursusApprenantId/stats', [Authenticate], controller.getStatsByEtudiant.bind(controller))
router.get('/absences-cours/classe/:classeId/annee/:anneeAcademiqueId', [Authenticate], controller.getAbsencesByClasse.bind(controller))

export default router
