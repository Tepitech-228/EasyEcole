import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ChapitreCoursController from "../controllers/ChapitreCoursController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/cours/chapitres/"
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
    .get('/', ChapitreCoursController.getAllChapitresCours)
    .post('/', [AuthEnseignant, upload.fields([{name: 'image', maxCount: 1}])], ChapitreCoursController.createChapitreCours)
    .get('/:id', ChapitreCoursController.getChapitreCours)
    .put('/:id', [AuthEnseignant, upload.fields([{name: 'image', maxCount: 1}])], ChapitreCoursController.updateChapitreCours)
    .delete('/:id', [AuthEnseignant], ChapitreCoursController.deleteChapitreCours)
    .get('/statistics/count', [AuthEnseignant], ChapitreCoursController.getCount)

export default router