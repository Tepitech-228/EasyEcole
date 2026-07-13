import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import ApprenantController from "../controllers/ApprenantController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/apprenants/photos/"
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
 * /auth/apprenants:
 *   get:
 *     tags: [Apprenants]
 *     summary: Liste tous les apprenants
 *     responses:
 *       200:
 *         description: Liste des apprenants
 */
router
    .get('/', ApprenantController.getAllApprenants)
    // .post('/', [AuthInstitution], ApprenantController.createApprenant)
    /**
     * @openapi
     * /auth/apprenants/{id}:
     *   get:
     *     tags: [Apprenants]
     *     summary: Obtenir un apprenant par ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Apprenant trouvé
     *       404:
     *         description: Apprenant non trouvé
     */
    .get('/:id', ApprenantController.getApprenant)
    /**
     * @openapi
     * /auth/apprenants:
     *   put:
     *     tags: [Apprenants]
     *     summary: Mettre à jour un apprenant
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
     *         description: Apprenant mis à jour
     */
    .put('/', [], ApprenantController.updateApprenant)
    /**
     * @openapi
     * /auth/apprenants/photo:
     *   put:
     *     tags: [Apprenants]
     *     summary: Mettre à jour la photo de l'apprenant connecté
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
    .put('/photo', [Authenticate, upload.fields([{name: 'photo', maxCount: 1}])], ApprenantController.updatePhoto)
    /**
     * @openapi
     * /auth/apprenants/photo/{apprenantId}:
     *   put:
     *     tags: [Apprenants]
     *     summary: Mettre à jour la photo d'un apprenant par ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: apprenantId
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
     *               photo:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Photo mise à jour
     *       401:
     *         description: Non autorisé
     */
    .put('/photo/:apprenantId', [Authenticate, upload.fields([{name: 'photo', maxCount: 1}])], ApprenantController.updatePhoto)
    /**
     * @openapi
     * /auth/apprenants/qr-codes/generate:
     *   post:
     *     tags: [Apprenants]
     *     summary: Générer les QR codes des apprenants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: QR codes générés
     *       401:
     *         description: Non autorisé
     */
    .post('/qr-codes/generate', [AuthInstitution, CheckPermission('action.inscription.apprenant.generer-qr')], ApprenantController.generateQrCodes)
    /**
     * @openapi
     * /auth/apprenants:
     *   delete:
     *     tags: [Apprenants]
     *     summary: Supprimer des apprenants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Apprenants supprimés
     *       401:
     *         description: Non autorisé
     */
    .delete('/', [AuthInstitution, CheckPermission('action.inscription.apprenant.supprimer')], ApprenantController.deleteApprenant)
    /**
     * @openapi
     * /auth/apprenants/statistics/count:
     *   get:
     *     tags: [Apprenants]
     *     summary: Nombre total d'apprenants
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques
     *       401:
     *         description: Non autorisé
     */
    .get('/statistics/count', [AuthInstitution], ApprenantController.getCount)

export default router