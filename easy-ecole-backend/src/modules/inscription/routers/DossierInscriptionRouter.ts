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
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Tolère les PDF dont le navigateur envoie un MIME vide, générique
        // (application/octet-stream) ou dérivé (application/x-pdf)
        const isPdf = file.mimetype === 'application/pdf'
            || file.mimetype === 'application/x-pdf'
            || file.mimetype === 'application/octet-stream'
            || file.mimetype === ''
            || file.mimetype === undefined;
        if (isPdf && ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés'));
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 } // 20 Mo max par fichier
})

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
    .put('/', [Authenticate, upload.array('fichiers', 50)], DossierInscriptionController.uploadDossierInscription)

// Gestion dédiée des erreurs multer (taille, type, nombre) → 400 explicite au lieu du 500 générique
router.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        let message = "Erreur lors de l'upload du fichier";
        if (err.code === 'LIMIT_FILE_SIZE') message = "Le fichier dépasse la taille maximale autorisée (20 Mo)";
        else if (err.code === 'LIMIT_FILE_COUNT') message = "Trop de fichiers envoyés (50 maximum)";
        else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = "Champ de fichier inattendu";
        return res.status(400).json({ success: false, message });
    }
    if (err && err.message === 'Seuls les fichiers PDF sont acceptés') {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
})

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