import express from "express"
import multer from "multer"
import SupportController from "../controllers/SupportController"
import Authenticate from "../../../core/middlewares/Authenticate"

const upload = multer({ dest: "public/elearning/videos/" });

const router = express.Router()

router
    .get('/', [Authenticate], SupportController.getAll)
    .post('/', [Authenticate, upload.single('fichier')], SupportController.upload)
    .get('/:id', [Authenticate], SupportController.get)
    .delete('/:id', [Authenticate], SupportController.delete)

export default router
