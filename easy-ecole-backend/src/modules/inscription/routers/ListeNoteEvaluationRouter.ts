import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ListeNoteEvaluationController from "../controllers/ListeNoteEvaluationController"

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/inscription/pv/"
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
const upload = multer({ storage: storage, fileFilter: (req, file, callback) => {
    const allowed = ['.xlsx', '.xls']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
        callback(null, true)
    } else {
        callback(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'))
    }
}})

router
    .get('/', ListeNoteEvaluationController.getAllListesNoteEvaluation)
    .post('/', [], ListeNoteEvaluationController.createListeNoteEvaluation)
    .get('/:id', ListeNoteEvaluationController.getListeNoteEvaluation)
    .put('/:id', [], ListeNoteEvaluationController.updateListeNoteEvaluation)
    .delete('/:id', [], ListeNoteEvaluationController.deleteListeNoteEvaluation)
    .get('/statistics/count', [], ListeNoteEvaluationController.getCount)
    .get('/:id/export-pv', ListeNoteEvaluationController.exportPv)
    .post('/:id/import-pv', [upload.single('pv')], ListeNoteEvaluationController.importPv)

export default router