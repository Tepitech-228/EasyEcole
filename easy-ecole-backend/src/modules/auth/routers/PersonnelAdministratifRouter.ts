import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'
import PersonnelAdministratifController from "../controllers/PersonnelAdministratifController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthAdmin } from "../../../core/middlewares/AuthAdmin"
import CheckPermission from "../../../core/middlewares/CheckPermission"

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
        const ext = path.extname(file.originalname)
        callback(null, nanoid() + ext)
    },
})
const upload = multer({ storage: storage })

const router = express.Router()

router
    .get('/', [Authenticate, AuthAdmin], PersonnelAdministratifController.getAll)
    .get('/:id', [Authenticate], PersonnelAdministratifController.get)
    .put('/', [Authenticate], upload.single('photo'), PersonnelAdministratifController.update)
    .put('/photo', [Authenticate], upload.single('photo'), PersonnelAdministratifController.updatePhoto)
    .delete('/:id', [Authenticate, AuthAdmin], PersonnelAdministratifController.delete)

export default router
