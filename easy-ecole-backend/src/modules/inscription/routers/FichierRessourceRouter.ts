import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import FichierRessourceController from "../controllers/FichierRessourceController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant"

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/cours/ressources/"
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
 * /inscription/fichiersRessource:
 *   get:
 *     tags: [Fichiers Ressource]
 *     summary: Liste tous les fichiers ressource
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des fichiers ressource
 */
router
    .get('/', FichierRessourceController.getAllFichierRessources)

/**
 * @openapi
 * /inscription/fichiersRessource:
 *   post:
 *     tags: [Fichiers Ressource]
 *     summary: Crée un nouveau fichier ressource
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
 *         description: Fichier ressource créé
 */
    .post('/', [AuthEnseignant, upload.fields([{name: 'fichier', maxCount: 1}])], FichierRessourceController.createFichierRessource)

/**
 * @openapi
 * /inscription/fichiersRessource/{id}:
 *   get:
 *     tags: [Fichiers Ressource]
 *     summary: Récupère un fichier ressource par ID
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
 *         description: Fichier ressource trouvé
 */
    .get('/:id', FichierRessourceController.getFichierRessource)

/**
 * @openapi
 * /inscription/fichiersRessource/{id}/download:
 *   get:
 *     tags: [Fichiers Ressource]
 *     summary: Télécharge un fichier ressource
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
 *         description: Fichier téléchargé
 */
    .get('/:id/download', FichierRessourceController.downloadFichierRessource)

/**
 * @openapi
 * /inscription/fichiersRessource/{id}:
 *   put:
 *     tags: [Fichiers Ressource]
 *     summary: Met à jour un fichier ressource
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
 *               fichier:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Fichier ressource mis à jour
 */
    .put('/:id', [AuthEnseignant, upload.fields([{name: 'fichier', maxCount: 1}])], FichierRessourceController.updateFichierRessource)

/**
 * @openapi
 * /inscription/fichiersRessource/{id}:
 *   delete:
 *     tags: [Fichiers Ressource]
 *     summary: Supprime un fichier ressource
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
 *         description: Fichier ressource supprimé
 */
    .delete('/:id', [AuthEnseignant], FichierRessourceController.deleteFichierRessource)

/**
 * @openapi
 * /inscription/fichiersRessource/statistics/count:
 *   get:
 *     tags: [Fichiers Ressource]
 *     summary: Compte le nombre de fichiers ressource
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de fichiers ressource
 */
    .get('/statistics/count', [AuthEnseignant], FichierRessourceController.getCount)

export default router