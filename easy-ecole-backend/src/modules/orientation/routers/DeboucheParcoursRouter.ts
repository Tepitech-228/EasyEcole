import express from "express"
import multer from "multer"

import DeboucheParcoursController from "../controllers/DeboucheParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const upload = multer({ dest: "public/orientation/debouches/" });

router
    .get('/', DeboucheParcoursController.getAllDebouchesParcours)
    .post('/', [AuthInstitution, upload.single('video')], DeboucheParcoursController.createDeboucheParcours)
    .get('/:id', DeboucheParcoursController.getDeboucheParcours)
    .put('/:id', [AuthInstitution, upload.single('video')], DeboucheParcoursController.updateDeboucheParcours)
    .delete('/:id', [AuthInstitution], DeboucheParcoursController.deleteDeboucheParcours)
    .get('/statistics/count', [AuthInstitution], DeboucheParcoursController.getCount)

export default router