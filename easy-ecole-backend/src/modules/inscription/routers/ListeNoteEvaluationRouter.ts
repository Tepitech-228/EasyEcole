import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import { RefuserRoles } from "../../../core/middlewares/RefuserRoles"
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur"
import ListeNoteEvaluationController from "../controllers/ListeNoteEvaluationController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { AuthSuperviseurGeneral } from "../../../core/middlewares/AuthSuperviseurGeneral"
import { AuthSecretariatGeneral } from "../../../core/middlewares/AuthSecretariatGeneral"

const router = express.Router()

router.use(Authenticate)
router.use(RefuserRoles(RolesUtilisateur.PARENT))

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
    const allowed = ['.xlsx', '.xls', '.pdf']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
        callback(null, true)
    } else {
        callback(new Error('Seuls les fichiers Excel (.xlsx, .xls) ou PDF (.pdf) sont acceptés'))
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
    .get('/suivi', [AuthSuperviseurGeneral], ListeNoteEvaluationController.getSuivi)

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
    .post('/', [AuthSecretariatGeneral], ListeNoteEvaluationController.createListeNoteEvaluation)
    .post('/:id/publier', [AuthSecretariatGeneral], ListeNoteEvaluationController.publier)
    .post('/:id/bloquer', [AuthSuperviseurGeneral], ListeNoteEvaluationController.bloquerSaisie)
    .post('/:id/debloquer', [AuthSuperviseurGeneral], ListeNoteEvaluationController.debloquerSaisie)
    .post('/:id/cloturer', [AuthSuperviseurGeneral], ListeNoteEvaluationController.cloturerDefinitivement)
    .post('/:id/prolonger', [AuthSuperviseurGeneral], ListeNoteEvaluationController.prolongerDelai)
    .get('/:id/audit', [AuthSuperviseurGeneral], ListeNoteEvaluationController.getAudit)

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
    .put('/:id', [AuthSecretariatGeneral], ListeNoteEvaluationController.updateListeNoteEvaluation)

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
    .delete('/:id', [AuthSecretariatGeneral], ListeNoteEvaluationController.deleteListeNoteEvaluation)

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
 *     summary: Exporte un procès-verbal de notes au format Excel ou PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, pdf]
 *           default: excel
 *     responses:
 *       200:
 *         description: Fichier Excel ou PDF du PV
 */
    .get('/:id/export-pv', ListeNoteEvaluationController.exportPv)

/**
 * @openapi
 * /inscription/listesNoteEvaluation/{id}/import-pv:
 *   post:
 *     tags: [Listes Notes Évaluation]
 *     summary: Importe un procès-verbal de notes depuis un fichier Excel ou PDF
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