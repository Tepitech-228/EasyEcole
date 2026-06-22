import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ChapitreCoursController from "../controllers/ChapitreCoursController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/cours/chapitres/"
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
const upload = multer({ storage: storage })

/**
 * @openapi
 * /inscription/chapitresCours:
 *   get:
 *     tags: [Chapitres Cours]
 *     summary: Liste tous les chapitres de cours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des chapitres de cours
 */
router
    .get('/', ChapitreCoursController.getAllChapitresCours)

/**
 * @openapi
 * /inscription/chapitresCours:
 *   post:
 *     tags: [Chapitres Cours]
 *     summary: Crée un nouveau chapitre de cours
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Chapitre de cours créé
 */
    .post('/', [AuthEnseignant, upload.fields([{name: 'image', maxCount: 1}])], ChapitreCoursController.createChapitreCours)

/**
 * @openapi
 * /inscription/chapitresCours/{id}:
 *   get:
 *     tags: [Chapitres Cours]
 *     summary: Récupère un chapitre de cours par ID
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
 *         description: Chapitre de cours trouvé
 */
    .get('/:id', ChapitreCoursController.getChapitreCours)

/**
 * @openapi
 * /inscription/chapitresCours/{id}:
 *   put:
 *     tags: [Chapitres Cours]
 *     summary: Met à jour un chapitre de cours
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
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Chapitre de cours mis à jour
 */
    .put('/:id', [AuthEnseignant, upload.fields([{name: 'image', maxCount: 1}])], ChapitreCoursController.updateChapitreCours)

/**
 * @openapi
 * /inscription/chapitresCours/{id}:
 *   delete:
 *     tags: [Chapitres Cours]
 *     summary: Supprime un chapitre de cours
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
 *         description: Chapitre de cours supprimé
 */
    .delete('/:id', [AuthEnseignant], ChapitreCoursController.deleteChapitreCours)

/**
 * @openapi
 * /inscription/chapitresCours/statistics/count:
 *   get:
 *     tags: [Chapitres Cours]
 *     summary: Compte le nombre de chapitres de cours
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de chapitres de cours
 */
    .get('/statistics/count', [AuthEnseignant], ChapitreCoursController.getCount)

export default router