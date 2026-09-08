import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"

import OcrController from "../controllers/OcrController"

const router = express.Router()

// Stockage temporaire des pièces à analyser (supprimées après traitement côté service).
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir = "public/inscription/ocr/tmp/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const ext = path.extname(file.originalname) || '.pdf'
        const name = require('crypto').randomBytes(16).toString('hex') + ext
        callback(null, name)
    },
})
const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024, files: 10 },
})

/**
 * @openapi
 * /inscription/ocr/pre-remplissage:
 *   post:
 *     tags: [Inscription OCR]
 *     summary: Pré-remplit les informations personnelles de l'étudiant via OCR/ICR
 *     description: >
 *       Reçoit les pièces téléversées et retourne les champs d'informations
 *       personnelles pré-remplis (à corriger puis valider par l'étudiant).
 *       Le moteur OCR est branchable (recommandation : PaddleOCR/Surya on-premise).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Informations extraites (champs pré-remplis)
 */
router.post('/pre-remplissage', upload.array('documents', 10), OcrController.preRemplissage)
router.post('/pre-remplissage-async', upload.array('documents', 10), OcrController.preRemplissageAsync)

export default router
