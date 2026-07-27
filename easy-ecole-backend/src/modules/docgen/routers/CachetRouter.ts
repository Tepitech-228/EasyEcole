import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import CachetController from "../controllers/CachetController";
import Authenticate from "../../../core/middlewares/Authenticate";

const uploadDir = path.resolve('public/docgen/cachets');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `cachet_${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

/**
 * @openapi
 * /docgen/cachets:
 *   get:
 *     tags: [DocGen - Cachets]
 *     summary: Liste tous les cachets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des cachets
 */
router.get('/', [Authenticate], CachetController.getAll);

/**
 * @openapi
 * /docgen/cachets/active:
 *   get:
 *     tags: [DocGen - Cachets]
 *     summary: Récupère le cachet actif
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cachet actif
 */
router.get('/active', [Authenticate], CachetController.getActive);

/**
 * @openapi
 * /docgen/cachets/upload:
 *   post:
 *     tags: [DocGen - Cachets]
 *     summary: Téléverse une image de cachet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cachet:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Cachet uploadé
 */
router.post('/upload', [Authenticate], upload.single('cachet'), CachetController.upload);

/**
 * @openapi
 * /docgen/cachets/{id}:
 *   put:
 *     tags: [DocGen - Cachets]
 *     summary: Met à jour un cachet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cachet mis à jour
 *   delete:
 *     tags: [DocGen - Cachets]
 *     summary: Supprime un cachet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cachet supprimé
 */
router.put('/:id', [Authenticate], CachetController.update);

/**
 * @openapi
 * /docgen/cachets/{id}/active:
 *   put:
 *     tags: [DocGen - Cachets]
 *     summary: Définit un cachet comme actif
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cachet activé
 */
router.put('/:id/active', [Authenticate], CachetController.setActive);

router.delete('/:id', [Authenticate], CachetController.delete);

export default router;
