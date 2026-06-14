import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import AuthController from "../controllers/AuthController"
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/profiles/"
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
    .post('/login', AuthController.login)
    .post('/register', AuthController.register)
    .post('/register/enseignant', [Authenticate, AuthInstitution], AuthController.registerEnseignant)
    .post('/update-profile', [Authenticate, upload.single('profile')], AuthController.updateProfile)
    .get('/send-email-confirm-link', [Authenticate], AuthController.sendEmailConfirmLink)
    .post('/confirm', AuthController.emailConfirm)
    .get('/send-password-reset-link', AuthController.sendPasswordResetLink)
    .put('/reset', [Authenticate], AuthController.passwordReset)

export default router