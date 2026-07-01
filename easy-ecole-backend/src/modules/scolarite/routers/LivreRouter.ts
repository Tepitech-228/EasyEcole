import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import LivreController from "../controllers/LivreController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const UPLOAD_DIR = "public/bibliotheque"
const fullPath = path.resolve(process.cwd(), UPLOAD_DIR)
if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, fullPath),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname) || '.pdf'
        cb(null, unique + ext)
    }
})

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true)
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'))
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }
})

const router = express.Router()

router
    .get('/', [Authenticate], LivreController.getAll)
    .get('/fichier/:id', [Authenticate], LivreController.getFichierInfo)
    .get('/download/:id', [Authenticate], LivreController.download)
    .post('/', [Authenticate, AuthInstitution, upload.single('fichier')], LivreController.upload)
    .post('/:id/consulter', [Authenticate], LivreController.consulter)
    .delete('/:id', [Authenticate, AuthInstitution], LivreController.delete)

export default router
