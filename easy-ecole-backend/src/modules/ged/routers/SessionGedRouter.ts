import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import SessionGedController from "../controllers/SessionGedController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import { GED_CONFIG } from "../../../core/config/GedConfig";

const UPLOAD_DIR = GED_CONFIG.UPLOAD_DIR;
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
      /**
     * @openapi
     * /:
     *   get:
     *     tags: [GED]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], SessionGedController.list)
      /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', [Authenticate], SessionGedController.get)
      /**
     * @openapi
     * /:
     *   post:
     *     tags: [GED]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', [Authenticate, AuthInstitution], SessionGedController.create)
      /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [GED]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', [Authenticate, AuthInstitution], SessionGedController.update)
      /**
     * @openapi
     * /batch-upload:
     *   post:
     *     tags: [GED]
     *     summary: POST /batch-upload
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/batch-upload', [Authenticate, AuthInstitution, upload.array('fichiers', 20)], SessionGedController.uploadBatch)
      /**
     * @openapi
     * /:id/share-link:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id/share-link
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id/share-link', [Authenticate, AuthInstitution], SessionGedController.generateShareLink);


export default router;
