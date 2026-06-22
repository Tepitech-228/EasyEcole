import express from "express"
import multer from "multer";
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import AuthController from "../controllers/AuthController"
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const dir: string = "public/auth/profiles/"
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
 * /auth/login:
 *   post:
 *     tags: [Authentification]
 *     summary: Connexion utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               motDePasse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router
    .post('/login', AuthController.login)
    /**
     * @openapi
     * /auth/register:
     *   post:
     *     tags: [Authentification]
     *     summary: Inscription utilisateur
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               motDePasse:
     *                 type: string
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *     responses:
     *       201:
     *         description: Inscription réussie
     *       400:
     *         description: Données invalides
     */
    .post('/register', AuthController.register)
    /**
     * @openapi
     * /auth/register/enseignant:
     *   post:
     *     tags: [Authentification]
     *     summary: Inscription d'un enseignant par l'institution
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *     responses:
     *       201:
     *         description: Enseignant inscrit
     *       401:
     *         description: Non autorisé
     */
    .post('/register/enseignant', [Authenticate, AuthInstitution], AuthController.registerEnseignant)
    /**
     * @openapi
     * /auth/update-profile:
     *   post:
     *     tags: [Authentification]
     *     summary: Mise à jour du profil avec photo
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               profile:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Profil mis à jour
     *       401:
     *         description: Non autorisé
     */
    .post('/update-profile', [Authenticate, upload.single('profile')], AuthController.updateProfile)
    /**
     * @openapi
     * /auth/send-email-confirm-link:
     *   get:
     *     tags: [Authentification]
     *     summary: Envoyer le lien de confirmation email
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Lien envoyé
     *       401:
     *         description: Non autorisé
     */
    .get('/send-email-confirm-link', [Authenticate], AuthController.sendEmailConfirmLink)
    /**
     * @openapi
     * /auth/confirm:
     *   post:
     *     tags: [Authentification]
     *     summary: Confirmation de l'adresse email
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *     responses:
     *       200:
     *         description: Email confirmé
     *       400:
     *         description: Token invalide
     */
    .post('/confirm', AuthController.emailConfirm)
    /**
     * @openapi
     * /auth/send-password-reset-link:
     *   get:
     *     tags: [Authentification]
     *     summary: Envoyer le lien de réinitialisation du mot de passe
     *     parameters:
     *       - in: query
     *         name: email
     *         schema:
     *           type: string
     *         required: true
     *         description: Adresse email
     *     responses:
     *       200:
     *         description: Lien envoyé
     *       404:
     *         description: Email non trouvé
     */
    .get('/send-password-reset-link', AuthController.sendPasswordResetLink)
    /**
     * @openapi
     * /auth/reset:
     *   put:
     *     tags: [Authentification]
     *     summary: Réinitialisation du mot de passe
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               motDePasse:
     *                 type: string
     *               token:
     *                 type: string
     *     responses:
     *       200:
     *         description: Mot de passe réinitialisé
     *       401:
     *         description: Non autorisé
     */
    .put('/reset', [Authenticate], AuthController.passwordReset)

export default router