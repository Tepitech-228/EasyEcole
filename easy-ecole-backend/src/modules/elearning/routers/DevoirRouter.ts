import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import DevoirController from "../controllers/DevoirController"
import Authenticate from "../../../core/middlewares/Authenticate"

const UPLOAD_DIR = "public/elearning/devoirs"
const fullPath = path.resolve(process.cwd(), UPLOAD_DIR)
if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, fullPath),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

const router = express.Router()
router
  .get('/', [Authenticate], DevoirController.getAll)
  .post('/', [Authenticate], DevoirController.create)
  .get('/:id', [Authenticate], DevoirController.get)
  .post('/:id/soumettre', [Authenticate, upload.single('fichier')], DevoirController.soumettre)
  .put('/:id/noter/:soumissionId', [Authenticate], DevoirController.noter)
  .get('/:id/download/:soumissionId', [Authenticate], DevoirController.downloadSoumission)
  .delete('/:id', [Authenticate], DevoirController.delete)

export default router
