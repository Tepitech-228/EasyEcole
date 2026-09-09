import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'
import PersonnelAdministratifController from "../controllers/PersonnelAdministratifController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthAdmin } from "../../../core/middlewares/AuthAdmin"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp'])
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const storage = multer.diskStorage({
    destination: (req: any, file: any, callback: any) => {
        const dir: string = "public/auth/profiles/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        callback(null, dir)
    },
    filename: (req: any, file: any, callback: any) => {
        const nanoid = customAlphabet('1234567890abcdef', 50)
        const ext = file.mimetype === 'image/jpeg' ? '.jpg' : `.${file.mimetype.split('/')[1]}`
        callback(null, nanoid() + ext)
    },
})
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(file.mimetype))
    },
    limits: { fileSize: 5 * 1024 * 1024 },
})

const router = express.Router()

router
    .get('/', [Authenticate, AuthAdmin], PersonnelAdministratifController.getAll)
    .get('/:id', [Authenticate], PersonnelAdministratifController.get)
    .put('/', [Authenticate], upload.single('photo'), PersonnelAdministratifController.update)
    .put('/photo', [Authenticate], upload.single('photo'), PersonnelAdministratifController.updatePhoto)
    .post('/qr-codes/generate', [Authenticate, AuthInstitution, CheckPermission('action.administration.personnel.generer-qr')], PersonnelAdministratifController.generateQRs)
    .get('/qr-codes/:fileName', PersonnelAdministratifController.getQrCode)
    .delete('/:id', [Authenticate, AuthAdmin], PersonnelAdministratifController.delete)

export default router
