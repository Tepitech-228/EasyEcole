import express from "express"
import multer from "multer";
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'
import rateLimit from 'express-rate-limit'

import AuthController from "../controllers/AuthController"
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const resendOtpLimiter = rateLimit({
  windowMs: 30000,
  max: 1,
  keyGenerator: (req) => req.body?.email || 'unknown',
  handler: (req, res) => {
    res.status(429).json({ error: 'rate_limited', message: 'Attendez 30s avant de renvoyer' })
  }
})

const loginLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives, réessayez dans 1 minute' }
})

const verifyOtpLimiter = rateLimit({
  windowMs: 60000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives de vérification, réessayez dans 1 minute' }
})

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
        const ext = path.extname(file.originalname)
        callback(null, nanoid() + ext)
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
    .post('/login', [loginLimiter], AuthController.login)
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
    .post('/register/enseignant', [Authenticate, AuthInstitution, CheckPermission('action.administration.enseignant.inscrire')], AuthController.registerEnseignant)
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
    .post('/reset-password', AuthController.passwordResetWithToken)
    .post('/logout', [Authenticate], AuthController.logout)
    .post('/verify-otp', [verifyOtpLimiter], AuthController.verifyOtp)
    .post('/resend-otp', [resendOtpLimiter], AuthController.resendOtp)

export default router