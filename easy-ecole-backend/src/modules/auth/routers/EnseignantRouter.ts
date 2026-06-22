import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import EnseignantController from "../controllers/EnseignantController"
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/enseignants/photos/"
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        callback(null, dir)
    },
    filename: (req, file, callback) => {
        const nanoid = customAlphabet('1234567890abcdef', 50)
        
        callback(null, nanoid())
    },
})
const upload = multer({ storage: storage })

/**
 * @openapi
 * /auth/enseignants:
 *   get:
 *     tags: [Enseignants]
 *     summary: Liste tous les enseignants
 *     responses:
 *       200:
 *         description: Liste des enseignants
 */
router
    .get('/', EnseignantController.getAllEnseignants)
    /**
     * @openapi
     * /auth/enseignants/{id}:
     *   get:
     *     tags: [Enseignants]
     *     summary: Obtenir un enseignant par ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Enseignant trouvé
     *       404:
     *         description: Enseignant non trouvé
     */
    .get('/:id', EnseignantController.getEnseignant)
    /**
     * @openapi
     * /auth/enseignants:
     *   put:
     *     tags: [Enseignants]
     *     summary: Mettre à jour un enseignant
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *     responses:
     *       200:
     *         description: Enseignant mis à jour
     */
    .put('/', [], EnseignantController.updateEnseignant)
    /**
     * @openapi
     * /auth/enseignants/photo:
     *   put:
     *     tags: [Enseignants]
     *     summary: Mettre à jour la photo de l'enseignant
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               photo:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Photo mise à jour
     *       401:
     *         description: Non autorisé
     */
    .put('/photo', [AuthEnseignant, upload.fields([{name: 'photo', maxCount: 1}])], EnseignantController.updatePhoto)
    /**
     * @openapi
     * /auth/enseignants/qr-codes/generate:
     *   post:
     *     tags: [Enseignants]
     *     summary: Générer les QR codes des enseignants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: QR codes générés
     *       401:
     *         description: Non autorisé
     */
    .post('/qr-codes/generate', [AuthInstitution], EnseignantController.generateQrCodes)
    /**
     * @openapi
     * /auth/enseignants:
     *   delete:
     *     tags: [Enseignants]
     *     summary: Supprimer des enseignants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Enseignants supprimés
     *       401:
     *         description: Non autorisé
     */
    .delete('/', [AuthInstitution], EnseignantController.deleteEnseignant)
    /**
     * @openapi
     * /auth/enseignants/statistics/count:
     *   get:
     *     tags: [Enseignants]
     *     summary: Nombre total d'enseignants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques
     *       401:
     *         description: Non autorisé
     */
    .get('/statistics/count', [AuthEnseignant], EnseignantController.getCount)

export default router