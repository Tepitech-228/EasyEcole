import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from "nanoid"

import ExcelController from "../controllers/ExcelController"

const router = express.Router()

// Configuration Multer pour les fichiers Excel
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir = "public/excel/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname)
        const nanoid = customAlphabet("1234567890abcdef", 30)
        callback(null, nanoid() + "_" + uniqueSuffix)
    },
})

const upload = multer({
    storage,
    fileFilter: (req, file, callback) => {
        const allowed = [".xlsx", ".xls"]
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowed.includes(ext)) {
            callback(null, true)
        } else {
            callback(new Error("Seuls les fichiers Excel (.xlsx, .xls) sont acceptés"))
        }
    },
})

// ========================================================================
//  UE (COURS)
// ========================================================================

/**
 * @openapi
 * /inscription/excel/ue/template:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Télécharger le template Excel pour l'import des UE
 */
router.get("/ue/template", ExcelController.downloadUeTemplate)

/**
 * @openapi
 * /inscription/excel/ue/import:
 *   post:
 *     tags: [Excel Import/Export]
 *     summary: Importer des UE depuis un fichier Excel
 */
router.post("/ue/import", upload.single("fichier"), ExcelController.importUe)

/**
 * @openapi
 * /inscription/excel/ue/export:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Exporter toutes les UE au format Excel
 */
router.get("/ue/export", ExcelController.exportUe)

// ========================================================================
//  ENSEIGNANTS
// ========================================================================

/**
 * @openapi
 * /inscription/excel/enseignants/template:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Télécharger le template Excel pour l'import des enseignants
 */
router.get("/enseignants/template", ExcelController.downloadEnseignantTemplate)

/**
 * @openapi
 * /inscription/excel/enseignants/import:
 *   post:
 *     tags: [Excel Import/Export]
 *     summary: Importer des enseignants depuis un fichier Excel
 */
router.post("/enseignants/import", upload.single("fichier"), ExcelController.importEnseignants)

/**
 * @openapi
 * /inscription/excel/enseignants/export:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Exporter tous les enseignants au format Excel
 */
router.get("/enseignants/export", ExcelController.exportEnseignants)

// ========================================================================
//  APPRENANTS
// ========================================================================

/**
 * @openapi
 * /inscription/excel/apprenants/template:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Télécharger le template Excel pour l'import des apprenants
 */
router.get("/apprenants/template", ExcelController.downloadApprenantTemplate)

/**
 * @openapi
 * /inscription/excel/apprenants/import:
 *   post:
 *     tags: [Excel Import/Export]
 *     summary: Importer des apprenants (avec création automatique de demande d'inscription)
 */
router.post("/apprenants/import", upload.single("fichier"), ExcelController.importApprenants)

/**
 * @openapi
 * /inscription/excel/apprenants/export:
 *   get:
 *     tags: [Excel Import/Export]
 *     summary: Exporter tous les apprenants au format Excel
 */
router.get("/apprenants/export", ExcelController.exportApprenants)

export default router
