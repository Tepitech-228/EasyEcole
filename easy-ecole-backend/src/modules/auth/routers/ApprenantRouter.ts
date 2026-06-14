import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ApprenantController from "../controllers/ApprenantController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/apprenants/photos/"
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
    .get('/', ApprenantController.getAllApprenants)
    // .post('/', [AuthInstitution], ApprenantController.createApprenant)
    .get('/:id', ApprenantController.getApprenant)
    .put('/', [], ApprenantController.updateApprenant)
    .put('/photo', [AuthApprenant, upload.fields([{name: 'photo', maxCount: 1}])], ApprenantController.updatePhoto)
    .delete('/', [AuthInstitution], ApprenantController.deleteApprenant)
    .get('/statistics/count', [AuthInstitution], ApprenantController.getCount)

export default router