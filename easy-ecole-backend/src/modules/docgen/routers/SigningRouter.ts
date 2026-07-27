import { Router } from "express";
import SigningController from "../controllers/SigningController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

/**
 * @openapi
 * /docgen/signing/pending/enseignant:
 *   get:
 *     tags: [DocGen - Signatures]
 *     summary: Documents en attente de signature pour les enseignants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des documents en attente
 */
router.get('/pending/enseignant', [Authenticate], SigningController.getPendingForTeacher);

/**
 * @openapi
 * /docgen/signing/pending/direction:
 *   get:
 *     tags: [DocGen - Signatures]
 *     summary: Documents en attente de signature pour la direction
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des documents en attente
 */
router.get('/pending/direction', [Authenticate], SigningController.getPendingForDirector);

/**
 * @openapi
 * /docgen/signing/documents/{classe}:
 *   get:
 *     tags: [DocGen - Signatures]
 *     summary: Documents par classe pour signature
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classe
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Documents de la classe
 */
router.get('/documents/:classe', [Authenticate], SigningController.getDocumentsByClasse);

/**
 * @openapi
 * /docgen/signing/batch:
 *   post:
 *     tags: [DocGen - Signatures]
 *     summary: Signe en lot des documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Documents signés
 */
router.post('/batch', [Authenticate], SigningController.signBatch);

export default router;
