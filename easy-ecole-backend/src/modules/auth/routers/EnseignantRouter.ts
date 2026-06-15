import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import EnseignantController from "../controllers/EnseignantController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/enseignants/photos/"
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const nanoid = customAlphabet('1234567890abcdef', 50)
        
        callback(null, nanoid())
    },
})
const upload = multer({ storage: storage })

router
    .get('/', EnseignantController.getAllEnseignants)
    .get('/:id', EnseignantController.getEnseignant)
    .put('/', [], EnseignantController.updateEnseignant)
    .put('/photo', [AuthEnseignant, upload.fields([{name: 'photo', maxCount: 1}])], EnseignantController.updatePhoto)
    .post('/qr-codes/generate', [AuthInstitution], EnseignantController.generateQrCodes)
    .delete('/', [AuthInstitution], EnseignantController.deleteEnseignant)
    .get('/statistics/count', [AuthEnseignant], EnseignantController.getCount)

export default router