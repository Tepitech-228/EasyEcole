import express from "express"
import multer from "multer"
import * as path from "path"
import * as fs from "fs"
import { customAlphabet } from 'nanoid'

import DemandeInscriptionController from "../controllers/DemandeInscriptionController"
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";
import { AuthComiteOrientation } from "../../../core/middlewares/AuthComiteOrientation";
import { validerEmail, validerIdentifiantX } from "../../../core/validators/validators";

const router = express.Router()

/** Multer pour l'upload du justificatif de bourse (PDF, 20 Mo max) */
const bourseStorage = multer.diskStorage({
    destination: (_req, file, callback) => {
        const dir = "public/inscription/dossiers/"
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        callback(null, dir)
    },
    filename: (_req, file, callback) => {
        const suffix = Date.now() + path.extname(file.originalname)
        const nanoid = customAlphabet('1234567890abcdef', 30)
        callback(null, 'bourse_' + nanoid() + '_' + suffix)
    },
})
const uploadBourse = multer({
    storage: bourseStorage,
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const isPdf = file.mimetype === 'application/pdf'
            || file.mimetype === 'application/x-pdf'
            || file.mimetype === 'application/octet-stream'
            || file.mimetype === ''
            || file.mimetype === undefined
        if (isPdf && ext === '.pdf') {
            cb(null, true)
        } else {
            cb(new Error('Seuls les fichiers PDF sont acceptés pour le justificatif de bourse'))
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 }
})

/**
 * @openapi
 * /inscription/demandesInscription:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Liste toutes les demandes d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes d'inscription
 */
router
    .get('/', DemandeInscriptionController.getAllDemandesInscription)
    .put('/batch/statut', [AuthComiteOrientation], DemandeInscriptionController.batchStatut)

/**
 * @openapi
 * /inscription/demandesInscription:
 *   post:
 *     tags: [Demandes d'Inscription]
 *     summary: Crée une nouvelle demande d'inscription
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
 *         description: Demande d'inscription créée
 */
    .post('/', [validerEmail, validerIdentifiantX], DemandeInscriptionController.createDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Récupère une demande d'inscription par ID
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
 *         description: Demande d'inscription trouvée
 */
    .get('/:id', DemandeInscriptionController.getDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/paiement/{matricule}:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Récupère une demande d'inscription depuis un paiement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matricule
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demande d'inscription trouvée
 */
    .get('/paiement/:matricule', DemandeInscriptionController.getDemandeInscriptionFromPaiement)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/cours:
 *   post:
 *     tags: [Demandes d'Inscription]
 *     summary: Ajoute des cours à une demande d'inscription
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
 *       201:
 *         description: Cours ajoutés à la demande
 */
    .post('/:id/cours', [ ], DemandeInscriptionController.createDemandeInscriptionCours)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/cours:
 *   put:
 *     tags: [Demandes d'Inscription]
 *     summary: Met à jour les cours d'une demande d'inscription
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
 *         description: Cours de la demande mis à jour
 */
    .put('/:id/cours', [ ], DemandeInscriptionController.updateDemandeInscriptionCours)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   put:
 *     tags: [Demandes d'Inscription]
 *     summary: Valide une demande d'inscription
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
 *         description: Demande d'inscription validée
 */
    .put('/:id', [], DemandeInscriptionController.validerDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/{id}:
 *   delete:
 *     tags: [Demandes d'Inscription]
 *     summary: Supprime une demande d'inscription
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
 *         description: Demande d'inscription supprimée
 */
    .delete('/:id', [], DemandeInscriptionController.deleteDemandeInscription)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/fiche-paiement:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Génère et télécharge la fiche de paiement (bordereau) PDF
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
 *         description: Fiche de paiement PDF
 */
    .get('/:id/fiche-paiement', DemandeInscriptionController.getFichePaiement)

/**
 * @openapi
 * /inscription/demandesInscription/{id}/statut-boursier:
 *   patch:
 *     tags: [Demandes d'Inscription]
 *     summary: Déclare ou met à jour le statut boursier de l'étudiant
 *     description: >
 *       L'étudiant déclare s'il est boursier. Si oui, il peut joindre
 *       un justificatif (PDF). Le document est visible par le comité d'orientation.
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
 *               estBoursier:
 *                 type: boolean
 *               fichier:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Statut boursier mis à jour
 */
    .patch('/:id/statut-boursier', [uploadBourse.single('fichier')], DemandeInscriptionController.updateStatutBoursier)

// Gestion dédiée des erreurs multer pour le bourse upload
router.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        let message = "Erreur lors de l'upload du justificatif de bourse"
        if (err.code === 'LIMIT_FILE_SIZE') message = "Le fichier dépasse la taille maximale autorisée (20 Mo)"
        return res.status(400).json({ success: false, message })
    }
    if (err?.message?.includes('PDF sont acceptés')) {
        return res.status(400).json({ success: false, message: err.message })
    }
    next(err)
})

/**
 * @openapi
 * /inscription/demandesInscription/statistics/count:
 *   get:
 *     tags: [Demandes d'Inscription]
 *     summary: Compte le nombre de demandes d'inscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de demandes d'inscription
 */
    .get('/statistics/count', [], DemandeInscriptionController.getCount)

export default router