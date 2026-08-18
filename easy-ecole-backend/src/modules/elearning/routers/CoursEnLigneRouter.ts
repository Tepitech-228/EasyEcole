import express from "express"
import multer from "multer"
import CoursEnLigneController from "../controllers/CoursEnLigneController"
import Authenticate from "../../../core/middlewares/Authenticate"
import { fileFilter, ALLOWED_IMAGE_TYPES } from "../../../core/config/upload"

const upload = multer({
    dest: "public/elearning/cours/",
    fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
    limits: { fileSize: 10 * 1024 * 1024 }
});
const router = express.Router()

/**
 * @openapi
 * /elearning/cours:
 *   get:
 *     tags: [Cours en Ligne]
 *     summary: Liste tous les cours en ligne
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des cours en ligne
 */
router
    .get('/', [Authenticate], CoursEnLigneController.getAll)

/**
 * @openapi
 * /elearning/cours:
 *   post:
 *     tags: [Cours en Ligne]
 *     summary: Crée un nouveau cours en ligne
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
 *         description: Cours en ligne créé
 */
    .post('/', [Authenticate, upload.single('image')], CoursEnLigneController.create)

/**
 * @openapi
 * /elearning/cours/{id}:
 *   get:
 *     tags: [Cours en Ligne]
 *     summary: Récupère un cours en ligne par ID
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
 *         description: Cours en ligne trouvé
 */
    .get('/:id/player', [Authenticate], CoursEnLigneController.getPlayer)
    .get('/:id', [Authenticate], CoursEnLigneController.get)

/**
 * @openapi
 * /elearning/cours/{id}:
 *   put:
 *     tags: [Cours en Ligne]
 *     summary: Met à jour un cours en ligne
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
 *         description: Cours en ligne mis à jour
 */
    .put('/:id', [Authenticate, upload.single('image')], CoursEnLigneController.update)

/**
 * @openapi
 * /elearning/cours/{id}:
 *   delete:
 *     tags: [Cours en Ligne]
 *     summary: Supprime un cours en ligne
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
 *         description: Cours en ligne supprimé
 */
    .delete('/:id', [Authenticate], CoursEnLigneController.delete)

export default router
