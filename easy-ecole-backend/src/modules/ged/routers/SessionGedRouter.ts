import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import SessionGedController from "../controllers/SessionGedController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const UPLOAD_DIR = "public/ged";
const fullPath = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(fullPath)) {
  fs.mkdirSync(fullPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, fullPath),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const acceptedMimes = ['application/pdf', 'image/tiff', 'image/x-tiff'];
    if (acceptedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et TIFF sont acceptés'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

router
  .get('/', [Authenticate], SessionGedController.list)
  .get('/:id', [Authenticate], SessionGedController.get)
  .post('/', [Authenticate, AuthInstitution], SessionGedController.create)
  .put('/:id', [Authenticate, AuthInstitution], SessionGedController.update)
  .post('/batch-upload', [Authenticate, AuthInstitution, upload.array('fichiers', 20)], SessionGedController.uploadBatch);

export default router;
