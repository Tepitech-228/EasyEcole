import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import DossierInscriptionController from "../controllers/DossierInscriptionController"
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/inscription/dossiers/"
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
 * /inscription/dossiersInscription:
 *   get:
 *     tags: [Dossiers d'Inscription]
 *     summary: Liste tous les dossiers d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des dossiers d'inscription
 */
router
    .get('/', DossierInscriptionController.getAllDossiersInscription)

/**
 * @openapi
 * /inscription/dossiersInscription:
 *   post:
 *     tags: [Dossiers d'Inscription]
 *     summary: Crée un nouveau dossier d'inscription
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
 *         description: Dossier d'inscription créé
 */
    .post('/', [], DossierInscriptionController.createDossierInscription)

/**
 * @openapi
 * /inscription/dossiersInscription:
 *   put:
 *     tags: [Dossiers d'Inscription]
 *     summary: Télécharge un fichier pour un dossier d'inscription
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
 *       200:
 *         description: Fichier téléchargé
 */
    .put('/', [Authenticate, upload.fields([{name: 'fichier', maxCount: 1}])], DossierInscriptionController.uploadDossierInscription)

/**
 * @openapi
 * /inscription/dossiersInscription/{id}:
 *   get:
 *     tags: [Dossiers d'Inscription]
 *     summary: Récupère un dossier d'inscription par ID
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
 *         description: Dossier d'inscription trouvé
 */
    .get('/:id', DossierInscriptionController.getDossierInscription)

/**
 * @openapi
 * /inscription/dossiersInscription/{id}:
 *   put:
 *     tags: [Dossiers d'Inscription]
 *     summary: Met à jour un dossier d'inscription
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
 *         description: Dossier d'inscription mis à jour
 */
    .put('/:id', [], DossierInscriptionController.updateDossierInscription)

/**
 * @openapi
 * /inscription/dossiersInscription/{id}:
 *   delete:
 *     tags: [Dossiers d'Inscription]
 *     summary: Supprime un dossier d'inscription
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
 *         description: Dossier d'inscription supprimé
 */
    .delete('/:id', [], DossierInscriptionController.deleteDossierInscription)

/**
 * @openapi
 * /inscription/dossiersInscription/statistics/count:
 *   get:
 *     tags: [Dossiers d'Inscription]
 *     summary: Compte le nombre de dossiers d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de dossiers d'inscription
 */
    .get('/statistics/count', [], DossierInscriptionController.getCount)

export default router