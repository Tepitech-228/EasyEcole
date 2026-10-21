import express from "express"
import multer from "multer"
import crypto from "crypto"
import SupportController from "../controllers/SupportController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { fileFilter, ALLOWED_VIDEO_TYPES } from "../../../core/config/upload"
import path from "path"
import fs from "fs"

// CRITIQUE : ces fichiers sont servis statiquement via /media/videos — un .html
// ou .svg y serait interprété (stored XSS). fileFilter strict : vidéo + PDF + images
// uniquement, jamais de contenu exécutable.
const SUPPORT_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "supports");
fs.mkdirSync(SUPPORT_DIR, { recursive: true });
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, SUPPORT_DIR),
        filename: (_req, file, callback) => callback(
            null,
            `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${path.extname(file.originalname).toLowerCase()}`
        )
    }),
    fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
    limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router()

/**
 * @openapi
 * /elearning/supports:
 *   get:
 *     tags: [Supports Pédagogiques]
 *     summary: Liste tous les supports pédagogiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des supports pédagogiques
 */
router
    .get('/', [Authenticate], SupportController.getAll)
    .get('/:id/fichier', [Authenticate], SupportController.download)

/**
 * @openapi
 * /elearning/supports:
 *   post:
 *     tags: [Supports Pédagogiques]
 *     summary: Télécharge un support pédagogique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Support téléchargé
 */
    .post('/', [Authenticate, upload.single('fichier')], SupportController.upload)

/**
 * @openapi
 * /elearning/supports/{id}:
 *   get:
 *     tags: [Supports Pédagogiques]
 *     summary: Récupère un support pédagogique par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Support pédagogique trouvé
 */
    .get('/:id', [Authenticate], SupportController.get)

/**
 * @openapi
 * /elearning/supports/{id}:
 *   delete:
 *     tags: [Supports Pédagogiques]
 *     summary: Supprime un support pédagogique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Support pédagogique supprimé
 */
    .delete('/:id', [Authenticate], SupportController.delete)

export default router
