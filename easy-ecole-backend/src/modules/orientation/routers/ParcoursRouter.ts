import express from "express"
import multer from "multer"

import ParcoursController from "../controllers/ParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const upload = multer({ dest: "public/orientation/parcours/" });

router
    .get('/', ParcoursController.getAllParcours)
    .post('/', [AuthInstitution, upload.fields([{name: 'image', maxCount: 1}, {name: 'video', maxCount: 1}])], ParcoursController.createParcours)
    .get('/:id', ParcoursController.getParcours)
    .put('/:id', [AuthInstitution, upload.fields([{name: 'image', maxCount: 1}, {name: 'video', maxCount: 1}])], ParcoursController.updateParcours)
    .delete('/:id', [AuthInstitution], ParcoursController.deleteParcours)
    .get('/statistics/count', [AuthInstitution], ParcoursController.getCount)

export default router