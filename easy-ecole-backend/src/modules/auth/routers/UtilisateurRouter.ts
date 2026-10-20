import express from "express"
import multer from "multer"
import * as fs from "fs"
import * as path from "path"
import { customAlphabet } from "nanoid"

import UtilisateurController from "../controllers/UtilisateurController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

const router = express.Router()
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
const storage = multer.diskStorage({
    destination: (req, _file, callback) => {
        let payload = req.body
        if (typeof req.body?.data === "string") {
            try {
                payload = JSON.parse(req.body.data)
            } catch {
                callback(new Error("Données de création utilisateur invalides"), "")
                return
            }
        }
        const directory = payload?.role === RolesUtilisateur.APPRENANT
            ? "public/auth/apprenants/photos/"
            : payload?.role === RolesUtilisateur.ENSEIGNANT
                ? "public/auth/enseignants/photos/"
                : "public/auth/profiles/"
        fs.mkdirSync(directory, { recursive: true })
        callback(null, directory)
    },
    filename: (_req, file, callback) => {
        const extension = file.mimetype === "image/jpeg" ? ".jpg" : `.${file.mimetype.split("/")[1]}`
        callback(null, customAlphabet("1234567890abcdef", 50)() + extension)
    }
})
const upload = multer({
    storage,
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase()
        callback(null, allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype))
    },
    limits: { fileSize: 5 * 1024 * 1024 }
})

function decodeCreatePayload(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (typeof req.body?.data !== "string") {
        next()
        return
    }
    try {
        const payload = JSON.parse(req.body.data)
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            res.status(400).json({ success: false, message: "Données de création utilisateur invalides." })
            return
        }
        req.body = payload
        next()
    } catch {
        res.status(400).json({ success: false, message: "Données de création utilisateur invalides." })
    }
}

function authorizeUserCreation(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (req.utilisateurRole !== RolesUtilisateur.ADMIN && req.utilisateurRole !== RolesUtilisateur.INSTITUTION) {
        res.status(403).json({ success: false, message: "Réservé à l'administration" })
        return
    }
    next()
}

/** GET /auth/utilisateurs — Liste tous les utilisateurs (admin/institution) */
router
    .get('/', [Authenticate], UtilisateurController.getAllUtilisateurs)
    /** POST /auth/utilisateurs — Créer un utilisateur (admin/institution) */
    .post('/', [Authenticate, authorizeUserCreation, upload.single("photo"), decodeCreatePayload], UtilisateurController.adminCreateUtilisateur)
    /** GET /auth/utilisateurs/moi — Retourne l'utilisateur courant (basé sur le token JWT) */
    .get('/moi', [Authenticate], UtilisateurController.getMoi)
    .get('/moi/sites', [Authenticate], UtilisateurController.getSitesMoi)
    .post('/moi/site-actif', [Authenticate], UtilisateurController.definirSiteActif)
    /** GET /auth/utilisateurs/:id — Obtenir un utilisateur par ID */
    .get('/:id', [Authenticate], UtilisateurController.getUtilisateur)
    /** PUT /auth/utilisateurs/:id — Modifier un utilisateur (admin/institution) */
    .put('/:id', [Authenticate], UtilisateurController.adminUpdateUtilisateur)
    /** PUT /auth/utilisateurs/:id/sites — Affecter un utilisateur à un ou plusieurs sites (admin) */
    .put('/:id/sites', [Authenticate], UtilisateurController.affecterSites)
    /** PUT /auth/utilisateurs — Modifier son propre profil */
    .put('/', [Authenticate], UtilisateurController.updateUtilisateur)
    /** DELETE /auth/utilisateurs/:id — Supprimer un utilisateur (admin/institution) */
    .delete('/:id', [Authenticate], UtilisateurController.deleteUtilisateur)
    /** GET /auth/utilisateurs/statistics/count */
    .get('/statistics/count', [Authenticate], UtilisateurController.getCount)

export default router
