import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import FichierRessourceController from "../controllers/FichierRessourceController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/cours/ressources/"
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
    .get('/', FichierRessourceController.getAllFichierRessources)
    .post('/', [AuthEnseignant, upload.fields([{name: 'fichier', maxCount: 1}])], FichierRessourceController.createFichierRessource)
    .get('/:id', FichierRessourceController.getFichierRessource)
    .get('/:id/download', FichierRessourceController.downloadFichierRessource)
    .put('/:id', [AuthEnseignant, upload.fields([{name: 'fichier', maxCount: 1}])], FichierRessourceController.updateFichierRessource)
    .delete('/:id', [AuthEnseignant], FichierRessourceController.deleteFichierRessource)
    .get('/statistics/count', [AuthEnseignant], FichierRessourceController.getCount)

export default router