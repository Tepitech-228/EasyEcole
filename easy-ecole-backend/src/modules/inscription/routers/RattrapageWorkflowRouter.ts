import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { customAlphabet } from "nanoid"

import Authenticate from "../../../core/middlewares/Authenticate"
import { InscriptionComplete } from "../../../core/middlewares/InscriptionComplete"
import RattrapageWorkflowController from "../controllers/RattrapageWorkflowController"

/**
 * Workflow officiel de rattrapage — voir RattrapageWorkflowController pour le flux
 * complet (session → demande → comité → paiement → inscription définitive).
 *
 * Deux zones de stockage distinctes :
 *  - `public/inscription/rattrapage/` : justificatifs déposés (RattrapageDocumentDepose).
 *  - `public/inscription/bordereaux/`  : bordereaux de paiement (compatibles avec le
 *    téléchargement existant GET /inscription/bordereaux/:id/download).
 */

function creerStorage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true })
      }
      cb(null, destination)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
      const nanoid = customAlphabet('1234567890abcdef', 24)
      cb(null, `${nanoid()}_${Date.now()}${ext}`)
    },
  })
}

// Seuls les PDF sont acceptés (mêmes tolérances MIME que DossierInscriptionRouter).
const fileFilterPdf = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const estPdf = file.mimetype === 'application/pdf'
    || file.mimetype === 'application/x-pdf'
    || file.mimetype === 'application/octet-stream'
    || file.mimetype === ''
    || file.mimetype === undefined
  if (estPdf && ext === '.pdf') {
    cb(null, true)
  } else {
    cb(new Error('Seuls les fichiers PDF sont acceptés'))
  }
}

const uploadDocument = multer({
  storage: creerStorage('public/inscription/rattrapage/'),
  fileFilter: fileFilterPdf,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
})

const uploadBordereau = multer({
  storage: creerStorage('public/inscription/bordereaux/'),
  fileFilter: fileFilterPdf,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
})

const router = express.Router()

router.use([Authenticate, InscriptionComplete])

router
  /**
   * @openapi
   * /inscription/rattrapage-workflow/sessions:
   *   post:
   *     tags: [Rattrapage Workflow]
   *     summary: Crée une session de rattrapage (ADMIN/INSTITUTION)
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [libelle]
   *             properties:
   *               libelle: { type: string }
   *               dateDebut: { type: string, format: date }
   *               dateFin: { type: string, format: date }
   *               anneeAcademiqueId: { type: number }
   *               description: { type: string }
   *               classesId: { type: array, items: { type: number } }
   *               documentsRequis:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     libelle: { type: string }
   *                     obligatoire: { type: boolean }
   *                     ordre: { type: number }
   *     responses:
   *       201:
   *         description: Session créée
   */
  .post('/sessions', RattrapageWorkflowController.creerSession)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/sessions:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Liste les sessions de rattrapage (tous connectés)
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des sessions avec nbDemandes
   */
  .get('/sessions', RattrapageWorkflowController.listerSessions)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/sessions/{id}:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Détail complet d'une session de rattrapage
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Session + classes + documents requis + demandes
   */
  .get('/sessions/:id', RattrapageWorkflowController.detailSession)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/sessions/{id}:
   *   put:
   *     tags: [Rattrapage Workflow]
   *     summary: Met à jour une session (libellé, période, statut, classes, documents requis)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               libelle: { type: string }
   *               dateDebut: { type: string, format: date }
   *               dateFin: { type: string, format: date }
   *               statut: { type: string, enum: [preparation, ouverte, cloturee] }
   *               description: { type: string }
   *               classesId: { type: array, items: { type: number } }
   *               documentsRequis:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     libelle: { type: string }
   *                     obligatoire: { type: boolean }
   *                     ordre: { type: number }
   *     responses:
   *       200:
   *         description: Session mise à jour
   */
  .put('/sessions/:id', RattrapageWorkflowController.modifierSession)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes:
   *   post:
   *     tags: [Rattrapage Workflow]
   *     summary: Soumet une demande de rattrapage (APPRENANT, session ouverte uniquement)
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [rattrapageSessionId]
   *             properties:
   *               rattrapageSessionId: { type: number }
   *               motifEtudiant: { type: string }
   *               creneauSouhaite: { type: string }
   *     responses:
   *       201:
   *         description: Demande créée
   */
  .post('/demandes', RattrapageWorkflowController.creerDemande)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Liste les demandes (apprenant : les siennes ; comité/admin : toutes, filtrable)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: statutDemande
   *         schema: { type: string, enum: [en_attente, valide, rejete] }
   *       - in: query
   *         name: rattrapageSessionId
   *         schema: { type: number }
   *     responses:
   *       200:
   *         description: Liste des demandes
   */
  .get('/demandes', RattrapageWorkflowController.listerDemandes)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/documents:
   *   post:
   *     tags: [Rattrapage Workflow]
   *     summary: Téléverse un justificatif pour sa demande (APPRENANT, propriétaire)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [documentRequisId, fichier]
   *             properties:
   *               documentRequisId: { type: string }
   *               fichier: { type: string, format: binary }
   *     responses:
   *       201:
   *         description: Liste actualisée des documents déposés
   */
  .post('/demandes/:id/documents', [uploadDocument.single('fichier')], RattrapageWorkflowController.uploaderDocument)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/documents/{documentDeposeId}/telecharger:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Télécharge/affiche un justificatif déposé (propriétaire, COMITE, ADMIN, INSTITUTION, CABINET_COMPTABLE)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: documentDeposeId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Contenu du justificatif (Content-Disposition inline)
   *       404:
   *         description: Document ou fichier introuvable
   */
  .get('/demandes/:id/documents/:documentDeposeId/telecharger', RattrapageWorkflowController.telechargerDocument)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/bordereau:
   *   post:
   *     tags: [Rattrapage Workflow]
   *     summary: Dépose le bordereau de paiement des frais (APPRENANT, demande validée par le comité)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [fichier]
   *             properties:
   *               fichier: { type: string, format: binary }
   *     responses:
   *       201:
   *         description: Bordereau créé (montant du paramètre global 'frais_rattrapage')
   */
  .post('/demandes/:id/bordereau', [uploadBordereau.single('fichier')], RattrapageWorkflowController.deposerBordereau)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Détail d'une demande (propriétaire ou comité)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Demande + session + documents + demandauteur + bordereau déposé
   */
  .get('/demandes/:id', RattrapageWorkflowController.detailDemande)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/valider:
   *   put:
   *     tags: [Rattrapage Workflow]
   *     summary: Valide une demande (COMITE/ADMIN/INSTITUTION) — débloque le paiement côté front
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Demande validée
   */
  .put('/demandes/:id/valider', RattrapageWorkflowController.validerDemande)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/rejeter:
   *   put:
   *     tags: [Rattrapage Workflow]
   *     summary: Rejette une demande avec motif (COMITE/ADMIN/INSTITUTION)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [motif]
   *             properties:
   *               motif: { type: string }
   *     responses:
   *       200:
   *         description: Demande rejetée
   */
  .put('/demandes/:id/rejeter', RattrapageWorkflowController.rejeterDemande)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/demandes/{id}/confirmer-paiement:
   *   put:
   *     tags: [Rattrapage Workflow]
   *     summary: Confirme le paiement et inscrit définitivement (CABINET_COMPTABLE/ADMIN)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paiement confirmé, inscription définitive
   */
  .put('/demandes/:id/confirmer-paiement', RattrapageWorkflowController.confirmerPaiement)
  /**
   * @openapi
   * /inscription/rattrapage-workflow/documents-requis/{sessionId}:
   *   get:
   *     tags: [Rattrapage Workflow]
   *     summary: Pièces justificatives requises pour une session (affichage upload)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Liste des documents requis
   */
  .get('/documents-requis/:sessionId', RattrapageWorkflowController.documentsRequisSession)

// Gestion dédiée des erreurs multer (taille, type, champ inattendu) → 400 explicite
// (même pattern que DossierInscriptionRouter).
router.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    let message = "Erreur lors de l'upload du fichier"
    if (err.code === 'LIMIT_FILE_SIZE') message = 'Le fichier dépasse la taille maximale autorisée (20 Mo)'
    else if (err.code === 'LIMIT_FILE_COUNT') message = 'Trop de fichiers envoyés (1 maximum)'
    else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Champ de fichier inattendu'
    return res.status(400).json({ success: false, message })
  }
  if (err && err.message === 'Seuls les fichiers PDF sont acceptés') {
    return res.status(400).json({ success: false, message: err.message })
  }
  next(err)
})

export default router