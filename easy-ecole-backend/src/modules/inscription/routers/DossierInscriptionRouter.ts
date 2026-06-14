import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import DossierInscriptionController from "../controllers/DossierInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/inscription/dossiers/"
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname)
        const nanoid = customAlphabet('1234567890abcdef', 30)
        
        callback(null, nanoid() + '_' + uniqueSuffix)
    },
})
const upload = multer({ storage: storage })

router
    .get('/', DossierInscriptionController.getAllDossiersInscription)
    .post('/', [], DossierInscriptionController.createDossierInscription)
    .put('/', [AuthApprenant, upload.fields([{name: 'fichier', maxCount: 1}])], DossierInscriptionController.uploadDossierInscription)
    .get('/:id', DossierInscriptionController.getDossierInscription)
    .put('/:id', [], DossierInscriptionController.updateDossierInscription)
    .delete('/:id', [], DossierInscriptionController.deleteDossierInscription)
    .get('/statistics/count', [], DossierInscriptionController.getCount)

export default router