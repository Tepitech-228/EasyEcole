import { Router } from "express";
import DocumentController from "../controllers/DocumentController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

/**
 * @openapi
 * /docgen/documents:
 *   get:
 *     tags: [DocGen - Documents]
 *     summary: Liste tous les documents générés
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des documents
 */
router.get('/', [Authenticate], DocumentController.getAll);

/**
 * @openapi
 * /docgen/documents/{id}:
 *   get:
 *     tags: [DocGen - Documents]
 *     summary: Récupère un document par ID
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
 *         description: Document trouvé
 */
router.get('/:id', [Authenticate], DocumentController.getById);

/**
 * @openapi
 * /docgen/documents/{id}/download:
 *   get:
 *     tags: [DocGen - Documents]
 *     summary: Télécharge le PDF d'un document
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
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/download', [Authenticate], DocumentController.download);

/**
 * @openapi
 * /docgen/documents/generate:
 *   post:
 *     tags: [DocGen - Documents]
 *     summary: Génère un document (relevé, attestation, diplôme, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               typeDocumentId:
 *                 type: integer
 *               etudiantId:
 *                 type: integer
 *               classeId:
 *                 type: integer
 *               anneeAcademiqueId:
 *                 type: integer
 *               semestre:
 *                 type: integer
 *               cursusApprenantId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Document généré avec succès
 */
router.post('/generate', [Authenticate], DocumentController.generate);

/**
 * @openapi
 * /docgen/documents/{id}:
 *   delete:
 *     tags: [DocGen - Documents]
 *     summary: Supprime un document
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
 *         description: Document supprimé
 */
router.delete('/:id', [Authenticate], DocumentController.delete);

export default router;
