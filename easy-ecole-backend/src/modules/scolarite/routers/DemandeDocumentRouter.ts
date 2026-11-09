import express from "express"
import multer from "multer"

import DemandeDocumentController from "../controllers/DemandeDocumentController"
import { AuthSecretariat } from "../../../core/middlewares/AuthSecretariat"

const router = express.Router()
const uploadPiece = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const acceptedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (acceptedMimes.includes(file.mimetype)) callback(null, true);
        else callback(new Error('Formats acceptés : PDF, JPG ou PNG'));
    }
}).single('fichier');

function gererErreurUpload(req: express.Request, res: express.Response, next: express.NextFunction): void {
    uploadPiece(req, res, error => {
        if (!error) return next();
        const tooLarge = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
        res.status(tooLarge ? 413 : 400).json({
            success: false,
            message: tooLarge ? 'Le fichier dépasse la taille maximale de 20 Mo' : error.message
        });
    });
}

router
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Liste toutes les demandes de documents
     *     responses:
     *       200:
     *         description: Liste des demandes
     */
    .get('/', DemandeDocumentController.getAllDemandesDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/mes-documents:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Liste les documents de l'étudiant connecté avec informations enrichies
     *     responses:
     *       200:
     *         description: Liste des documents avec statut de paiement et disponibilité
     */
    .get('/mes-documents', DemandeDocumentController.getMesDocuments)
    /**
     * @openapi
     * /scolarite/demandesDocument/paiements-disponibles:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Liste les reçus de recouvrement non utilisés pour le type demandé
     *     parameters:
     *       - in: query
     *         name: typeDocumentId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Reçus payés du demandeur encore disponibles
     */
    .get('/paiements-disponibles', DemandeDocumentController.getMesPaiementsDisponibles)
    /**
     * @openapi
     * /scolarite/demandesDocument:
     *   post:
     *     tags: [Demandes de documents]
     *     summary: Crée une nouvelle demande de document
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               typeDocumentId:
     *                 type: string
     *               recuCaisseId:
     *                 type: integer
     *                 description: Reçu du service de recouvrement à utiliser comme bordereau
     *               anneeAcademiqueId:
     *                 type: integer
     *                 description: Requise pour un relevé de notes
     *               semestre:
     *                 type: string
     *                 enum: [semestre1, semestre2, semestre3, semestre4, semestre5, semestre6]
     *                 description: Requis pour un relevé de notes
     *     responses:
     *       201:
     *         description: Demande créée
     */
    .post('/', DemandeDocumentController.createDemandeDocument)
    .patch('/:id/progression', DemandeDocumentController.sauvegarderProgressionWizard)
    .post('/:id/pieces', gererErreurUpload, DemandeDocumentController.televerserPieceDemande)
    .post('/:id/soumettre', DemandeDocumentController.soumettreDemandeWizard)
    .get('/:id/pieces/:pieceId', DemandeDocumentController.telechargerPieceDemande)
    .get('/:id/document-pdf', DemandeDocumentController.telechargerDocumentPret)
    .put('/:id/pieces/:pieceId/audit', DemandeDocumentController.auditerPieceDemandeDocument)
    .get('/comite/demandes', DemandeDocumentController.listerDemandesComiteDocuments)
    .post('/:id/comite/voter', DemandeDocumentController.deciderComiteDemandeDocument)
     .put('/batch/statut', [AuthSecretariat], DemandeDocumentController.batchStatut)
    .get('/autorisations-provisoires', [AuthSecretariat], DemandeDocumentController.getAutorisationsProvisoires)
    .get('/autorisations-provisoires/:id/download', [AuthSecretariat], DemandeDocumentController.telechargerAutorisationProvisoire)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Récupère une demande par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la demande
     */
    .get('/:id', DemandeDocumentController.getDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}:
     *   put:
     *     tags: [Demandes de documents]
     *     summary: Traite une demande (valider/rejeter/délivrer)
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
     *             properties:
     *               statut:
     *                 type: string
     *     responses:
     *       200:
     *         description: Demande mise à jour
     */
    .put('/:id', DemandeDocumentController.traiterDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/verifier-acces:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Indique si la demande est gratuite ou payante (montant, frais payés, source)
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Informations d'accès au document
     */
    .get('/:id/verifier-acces', DemandeDocumentController.verifierAccesDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/{id}/bordereau:
     *   post:
     *     deprecated: true
     *     tags: [Demandes de documents]
     *     summary: Ancien paiement après création (désactivé)
     *     responses:
     *       410:
     *         description: Le reçu de recouvrement doit précéder la demande
     */
    .post('/:id/bordereau', DemandeDocumentController.paiementApresCreationDesactive)
    .put('/:id/confirmer-paiement', DemandeDocumentController.paiementApresCreationDesactive)
    .post('/:id/confirmer-paiement-auto', DemandeDocumentController.paiementApresCreationDesactive)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}/preparer:
      *   put:
      *     tags: [Demandes de documents]
      *     summary: Prépare une demande de document pour le traitement secrétariat
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Demande préparée
      */
     .put('/:id/preparer', DemandeDocumentController.preparerDocument)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}/generer:
      *   put:
      *     tags: [Demandes de documents]
      *     summary: Génère le document PDF de la demande
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Document généré
      */
     .put('/:id/generer', DemandeDocumentController.genererDocument)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}/imprimer:
      *   put:
      *     tags: [Demandes de documents]
      *     summary: Confirme l'impression du document
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Impression confirmée
      */
     .put('/:id/imprimer', DemandeDocumentController.imprimerDocument)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}/remettre:
      *   put:
      *     tags: [Demandes de documents]
      *     summary: Remet le document à l'étudiant
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Document remis
      */
     .put('/:id/remettre', DemandeDocumentController.remettreDocument)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}/rejeter:
      *   put:
      *     tags: [Demandes de documents]
      *     summary: Rejette une demande de document
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Demande rejetée
      */
     .put('/:id/rejeter', DemandeDocumentController.rejeterDemande)
     /**
      * @openapi
      * /scolarite/demandesDocument/{id}:
      *   delete:
      *     tags: [Demandes de documents]
      *     summary: Supprime une demande
      *     parameters:
      *       - in: path
      *         name: id
      *         required: true
      *         schema:
      *           type: string
      *     responses:
      *       200:
      *         description: Demande supprimée
      */
     .delete('/:id', DemandeDocumentController.deleteDemandeDocument)
    /**
     * @openapi
     * /scolarite/demandesDocument/statistics/count:
     *   get:
     *     tags: [Demandes de documents]
     *     summary: Retourne le nombre total de demandes
     *     responses:
     *       200:
     *         description: Nombre de demandes
     */
    .get('/statistics/count', DemandeDocumentController.getCount)

export default router
