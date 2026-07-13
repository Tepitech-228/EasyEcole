import express from "express"
import multer from "multer"
import SupportController from "../controllers/SupportController"
import Authenticate from "../../../core/middlewares/Authenticate"

const upload = multer({ dest: "public/elearning/videos/" });

const router = express.Router()

/**
 * @openapi
 * /elearning/supports:
 *   get:
 *     tags: [Supports Pédagogiques]
 *     summary: Liste tous les supports pédagogiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des supports pédagogiques
 */
router
    .get('/', [Authenticate], SupportController.getAll)

/**
 * @openapi
 * /elearning/supports:
 *   post:
 *     tags: [Supports Pédagogiques]
 *     summary: Télécharge un support pédagogique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fichier:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Support téléchargé
 */
    .post('/', [Authenticate, upload.single('fichier')], SupportController.upload)

/**
 * @openapi
 * /elearning/supports/{id}:
 *   get:
 *     tags: [Supports Pédagogiques]
 *     summary: Récupère un support pédagogique par ID
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
 *         description: Support pédagogique trouvé
 */
    .get('/:id', [Authenticate], SupportController.get)

/**
 * @openapi
 * /elearning/supports/{id}:
 *   delete:
 *     tags: [Supports Pédagogiques]
 *     summary: Supprime un support pédagogique
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
 *         description: Support pédagogique supprimé
 */
    .delete('/:id', [Authenticate], SupportController.delete)

export default router
