import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import DocumentGedController from "../controllers/DocumentGedController";
import IntegrityController from "../controllers/IntegrityController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthAdmin } from "../../../core/middlewares/AuthAdmin";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import { AuthConfidentiality } from "../../../core/middlewares/AuthConfidentiality";
import { GED_CONFIG } from "../../../core/config/GedConfig";

const UPLOAD_DIR = GED_CONFIG.UPLOAD_DIR;
const fullPath = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, fullPath),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.pdf';
        cb(null, unique + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const acceptedMimes = ['application/pdf', 'image/tiff', 'image/x-tiff'];
        if (acceptedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF et TIFF sont acceptés'));
        }
    },
    limits: { fileSize: 3 * 1024 * 1024 * 1024 }
});

const router = express.Router();

router
    // Listing & search
        /**
     * @openapi
     * /:
     *   get:
     *     tags: [GED]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], DocumentGedController.getAll)

    // CRUD
        /**
     * @openapi
     * /:
     *   post:
     *     tags: [GED]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', [Authenticate, AuthInstitution, upload.single('fichier')], DocumentGedController.upload)
        /**
     * @openapi
     * /batch-upload:
     *   post:
     *     tags: [GED]
     *     summary: POST /batch-upload
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/batch-upload', [Authenticate, AuthInstitution, upload.array('fichiers', 50)], DocumentGedController.uploadBatch)
        /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [GED]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', [Authenticate, AuthInstitution, upload.single('fichier')], DocumentGedController.update)

    // Detail & download (with confidentiality check)
        /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', [Authenticate, AuthConfidentiality], DocumentGedController.get)
        /**
     * @openapi
     * /download/:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /download/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/download/:id', [Authenticate, AuthConfidentiality], DocumentGedController.download)
        /**
     * @openapi
     * /:id/pdf:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id/pdf
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id/pdf', [Authenticate, AuthConfidentiality], DocumentGedController.exportPdf)

    // Lifecycle
        /**
     * @openapi
     * /:id/validate:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/validate
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/validate', [Authenticate, AuthInstitution], DocumentGedController.validate)
        /**
     * @openapi
     * /:id/new-version:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/new-version
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/new-version', [Authenticate, AuthInstitution], DocumentGedController.newVersion)
        /**
     * @openapi
     * /:id/restore:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/restore
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/restore', [Authenticate], DocumentGedController.restore)

    // Locking
        /**
     * @openapi
     * /:id/lock:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/lock
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/lock', [Authenticate, AuthInstitution], DocumentGedController.lock)
        /**
     * @openapi
     * /:id/unlock:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/unlock
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/unlock', [Authenticate, AuthInstitution], DocumentGedController.unlock)

    // Deletion flow (replaces old DELETE)
        /**
     * @openapi
     * /:id/mark-for-deletion:
     *   put:
     *     tags: [GED]
     *     summary: PUT /:id/mark-for-deletion
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id/mark-for-deletion', [Authenticate], DocumentGedController.markForDeletion)
        /**
     * @openapi
     * /:id/confirm-deletion:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/confirm-deletion
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/confirm-deletion', [Authenticate], DocumentGedController.confirmDeletion)
        /**
     * @openapi
     * /:id:
     *   delete:
     *     tags: [GED]
     *     summary: DELETE /:id (suppression simple admin)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Document supprimé
     */
.delete('/:id', [Authenticate], DocumentGedController.delete)

    // Signature workflow
        /**
     * @openapi
     * /:id/request-signature:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/request-signature
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/request-signature', [Authenticate, AuthInstitution], DocumentGedController.requestSignature)
        /**
     * @openapi
     * /:id/sign:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/sign
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/sign', [Authenticate, AuthInstitution], DocumentGedController.sign)
        /**
     * @openapi
     * /:id/reject-signature:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/reject-signature
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/reject-signature', [Authenticate, AuthInstitution], DocumentGedController.rejectSignature)

    // Verification (public)
        /**
     * @openapi
     * /verify/:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /verify/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/verify/:id', [Authenticate], DocumentGedController.verifyDocument)

    // Integrity
        /**
     * @openapi
     * /:id/verify-integrity:
     *   post:
     *     tags: [GED]
     *     summary: POST /:id/verify-integrity
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/verify-integrity', [Authenticate, AuthAdmin], IntegrityController.verifyDocument)

    // Audit (with confidentiality check)
        /**
     * @openapi
     * /:id/audit-trail:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id/audit-trail
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id/audit-trail', [Authenticate, AuthConfidentiality], DocumentGedController.getAuditTrail)

export default router;
