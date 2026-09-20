import express, { Request, Response } from "express"
import multer from "multer"
import path from "path"

import { Op } from "sequelize";
import BordereauController from "../controllers/BordereauController"
import { AuthCabinetComptable } from "../../../core/middlewares/AuthCabinetComptable";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { Bordereau } from "../models/Bordereau";

const storage = multer.diskStorage({
    destination: "public/inscription/bordereaux/",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.pdf'
        const name = require('crypto').randomBytes(16).toString('hex') + ext
        cb(null, name)
    }
})
const upload = multer({ storage });
const router = express.Router()

router
    /**
     * @openapi
     * /inscription/bordereaux:
     *   get:
     *     tags: [Bordereaux]
     *     summary: Liste tous les bordereaux (filtré par étudiant pour apprenant)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: statut
     *         schema:
     *           type: string
     *           enum: [en_attente, valide, rejete]
     *         description: Filtrer par statut
     *       - in: query
     *         name: echeanceId
     *         schema:
     *           type: string
     *         description: Filtrer par échéance
     *     responses:
     *       200:
     *         description: Liste des bordereaux
     */
    .get('/', BordereauController.getAllBordereaux)
    .put('/batch/statut', [AuthCabinetComptable, CheckPermission('action.inscription.bordereau.valider')], BordereauController.batchStatut)
    /**
     * @openapi
     * /inscription/bordereaux/{id}:
     *   get:
     *     tags: [Bordereaux]
     *     summary: Récupère un bordereau par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du bordereau
     */
    .get('/:id', BordereauController.getBordereau)
    /**
     * @openapi
     * /inscription/bordereaux:
     *   post:
     *     tags: [Bordereaux]
     *     summary: Upload un bordereau de paiement (apprenant uniquement)
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - echeanceId
     *               - fichier
     *               - montant
     *             properties:
     *               echeanceId:
     *                 type: string
     *               fichier:
     *                 type: string
     *                 format: binary
     *               montant:
     *                 type: number
     *               referenceBancaire:
     *                 type: string
     *     responses:
     *       201:
     *         description: Bordereau créé
     */
    .post('/', [upload.fields([{name: 'fichier', maxCount: 1}])], BordereauController.createBordereau)
     /**
      * @openapi
      * /inscription/bordereaux/{id}/valider:
      *   put:
      *     tags: [Bordereaux]
      *     summary: Valide un bordereau (Audit uniquement)
      *     security: [{ bearerAuth: [] }]
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
      *             required:
      *               - referenceBancaire
      *               - numeroBordereau
      *               - datePaiement
      *             properties:
      *               referenceBancaire:
      *                 type: string
      *                 description: Référence bancaire obligatoire
      *               numeroBordereau:
      *                 type: string
      *                 description: Numéro de bordereau obligatoire
      *               datePaiement:
      *                 type: string
      *                 format: date
      *                 description: Date de paiement obligatoire (ISO)
      *               commentaire:
      *                 type: string
      *     responses:
      *       200:
      *         description: Bordereau validé
      */
     .put('/:id/valider', [AuthCabinetComptable, CheckPermission('action.inscription.bordereau.valider')], BordereauController.validerBordereau)
    /**
     * @openapi
     * /inscription/bordereaux/{id}/rejeter:
     *   put:
     *     tags: [Bordereaux]
     *     summary: Rejette un bordereau (Audit uniquement)
     *     security: [{ bearerAuth: [] }]
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
     *             required:
     *               - commentaire
     *             properties:
     *               commentaire:
     *                 type: string
     *     responses:
     *       200:
     *         description: Bordereau rejeté
     */
    .put('/:id/rejeter', [AuthCabinetComptable], BordereauController.rejeterBordereau)
     /**
      * @openapi
      * /inscription/bordereaux/verifier-unicite:
      *   get:
      *     tags: [Bordereaux]
      *     summary: Vérifie qu'une référence bancaire / un numéro de bordereau n'est pas déjà utilisé par un autre bordereau (Cabinet)
      *     security: [{ bearerAuth: [] }]
      *     parameters:
      *       - in: query
      *         name: referenceBancaire
      *         schema: { type: string }
      *       - in: query
      *         name: numeroBordereau
      *         schema: { type: string }
      *       - in: query
      *         name: excludeId
      *         schema: { type: integer }
      *     responses:
      *       200:
      *         description: { success, unique, conflit? }
      *       400:
      *         description: Paramètre manquant
      */
     .get('/verifier-unicite', [AuthCabinetComptable, CheckPermission('action.inscription.bordereau.valider')], async (req: Request, res: Response) => {
       try {
         const referenceBancaire = typeof req.query.referenceBancaire === 'string' ? req.query.referenceBancaire.trim() : '';
         const numeroBordereau = typeof req.query.numeroBordereau === 'string' ? req.query.numeroBordereau.trim() : '';
         const excludeId = req.query.excludeId ? Number(req.query.excludeId) : null;

         if (!referenceBancaire && !numeroBordereau) {
           return res.status(400).json({ success: false, message: 'Renseignez une référence bancaire ou un numéro de bordereau.' });
         }

         const whereClause: any = { deletedAt: null };
         const orConditions: any[] = [];
         if (referenceBancaire) orConditions.push({ referenceBancaire });
         if (numeroBordereau) orConditions.push({ numeroBordereau });
         if (excludeId && !isNaN(excludeId)) whereClause.id = { [Op.ne]: excludeId };
         whereClause[Op.or] = orConditions;

         const existant = await Bordereau.findOne({ where: whereClause, attributes: ['id', 'referenceBancaire', 'numeroBordereau'] });
         if (!existant) {
           return res.json({ success: true, unique: true });
         }

         const conflit = referenceBancaire && existant.referenceBancaire === referenceBancaire
           ? { champ: 'referenceBancaire', valeur: existant.referenceBancaire }
           : { champ: 'numeroBordereau', valeur: existant.numeroBordereau };
         return res.json({ success: true, unique: false, conflit });
       } catch (error: any) {
         console.error('[Bordereau] verifier-unicite ERREUR:', error?.message);
         return res.status(500).json({ success: false, message: "Erreur de vérification d'unicité." });
       }
     })
     /**
      * @openapi
      * /inscription/bordereaux/{id}/traiter:
      *   put:
      *     tags: [Bordereaux]
      *     summary: Traite un bordereau (Audit) — saisie type/montant constaté + cascade FIFO
      *     security: [{ bearerAuth: [] }]
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
      *             required:
      *               - type
      *               - montantConstate
      *               - referenceBancaire
      *               - numeroBordereau
      *               - datePaiement
      *             properties:
      *               type:
      *                 type: string
      *                 enum: [inscription, scolarite, rattrapage]
      *               montantConstate:
      *                 type: number
      *               referenceBancaire:
      *                 type: string
      *               numeroBordereau:
      *                 type: string
      *               datePaiement:
      *                 type: string
      *                 format: date
      *               commentaire:
      *                 type: string
      *     responses:
      *       200:
      *         description: Bordereau traité avec lettrage
      */
     .put('/:id/traiter', [AuthCabinetComptable, CheckPermission('action.inscription.bordereau.valider')], BordereauController.traiterBordereau)
    /**
     * @openapi
     * /inscription/bordereaux/{id}/download:
     *   get:
     *     tags: [Bordereaux]
     *     summary: Télécharge le fichier d'un bordereau avec le bon Content-Type
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Fichier du bordereau
     */
    .get('/:id/download', BordereauController.downloadBordereau)

export default router
