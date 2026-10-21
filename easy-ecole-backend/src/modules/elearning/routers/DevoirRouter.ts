import express from "express"
import multer from "multer"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import DevoirController from "../controllers/DevoirController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { fileFilter, ALLOWED_PDF_TYPES } from "../../../core/config/upload"

const DEVOIR_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "devoirs")
const SOUMISSION_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "soumissions")
for (const directory of [DEVOIR_DIR, SOUMISSION_DIR]) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true })
}

function pdfUpload(destination: string) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, destination),
      filename: (_req, _file, callback) => callback(null, `${Date.now()}-${crypto.randomBytes(10).toString("hex")}.pdf`),
    }),
    fileFilter: (req, file, callback) => {
      const isPdf = ALLOWED_PDF_TYPES.includes(file.mimetype) && path.extname(file.originalname).toLowerCase() === ".pdf"
      callback(null, isPdf)
    },
    limits: { fileSize: 20 * 1024 * 1024 },
  })
}
const subjectUpload = pdfUpload(DEVOIR_DIR)
const submissionUpload = pdfUpload(SOUMISSION_DIR)

const router = express.Router()
router
  .get('/', [Authenticate], DevoirController.getAll)
  .post('/', [Authenticate, subjectUpload.single('sujet')], DevoirController.create)
  .get('/:id/sujet', [Authenticate], DevoirController.downloadSujet)
  .get('/:id', [Authenticate], DevoirController.get)
  .post('/:id/soumettre', [Authenticate, submissionUpload.single('fichier')], DevoirController.soumettre)
  .put('/:id/noter/:soumissionId', [Authenticate], DevoirController.noter)
  .get('/:id/download/:soumissionId', [Authenticate], DevoirController.downloadSoumission)
  .delete('/:id', [Authenticate], DevoirController.delete)

export default router
