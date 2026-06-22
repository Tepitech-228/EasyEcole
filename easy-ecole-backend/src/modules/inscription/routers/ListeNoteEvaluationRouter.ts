import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ListeNoteEvaluationController from "../controllers/ListeNoteEvaluationController"

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/inscription/pv/"
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname)
        const nanoid = customAlphabet('1234567890abcdef', 30)
        callback(null, nanoid() + '_' + uniqueSuffix)
    },
})
const upload = multer({ storage: storage, fileFilter: (req, file, callback) => {
    const allowed = ['.xlsx', '.xls']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
        callback(null, true)
    } else {
        callback(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'))
    }
}})

/**
 * @openapi
 * /inscription/listesNoteEvaluation:
 *   get:
 *     tags: [Listes Notes Évaluation]
 *     summary: Liste toutes les listes de notes d'évaluation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des listes de notes d'évaluation
 */
router
    .get('/', ListeNoteEvaluationController.getAllListesNoteEvaluation)

/**
 * @openapi
 * /inscription/listesNoteEvaluation:
 *   post:
 *     tags: [Listes Notes Évaluation]
 *     summary: Crée une nouvelle liste de notes d'évaluation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Liste de notes créée
 */
    .post('/', [], ListeNoteEvaluationController.createListeNoteEvaluation)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}:
 *   get:
 *     tags: [Listes Notes Évaluation]
 *     summary: Récupère une liste de notes par ID
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
 *         description: Liste de notes trouvée
 */
    .get('/:id', ListeNoteEvaluationController.getListeNoteEvaluation)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}:
 *   put:
 *     tags: [Listes Notes Évaluation]
 *     summary: Met à jour une liste de notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Liste de notes mise à jour
 */
    .put('/:id', [], ListeNoteEvaluationController.updateListeNoteEvaluation)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}:
 *   delete:
 *     tags: [Listes Notes Évaluation]
 *     summary: Supprime une liste de notes
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
 *         description: Liste de notes supprimée
 */
    .delete('/:id', [], ListeNoteEvaluationController.deleteListeNoteEvaluation)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/statistics/count:
 *   get:
 *     tags: [Listes Notes Évaluation]
 *     summary: Compte le nombre de listes de notes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de listes de notes
 */
    .get('/statistics/count', [], ListeNoteEvaluationController.getCount)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}/export-pv:
 *   get:
 *     tags: [Listes Notes Évaluation]
 *     summary: Exporte un procès-verbal de notes au format Excel
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
 *         description: Fichier Excel du PV
 */
    .get('/:id/export-pv', ListeNoteEvaluationController.exportPv)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}/import-pv:
 *   post:
 *     tags: [Listes Notes Évaluation]
 *     summary: Importe un procès-verbal de notes depuis un fichier Excel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pv:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: PV importé
 */
    .post('/:id/import-pv', [upload.single('pv')], ListeNoteEvaluationController.importPv)

export default router