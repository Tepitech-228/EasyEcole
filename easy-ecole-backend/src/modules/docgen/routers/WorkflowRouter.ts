import { Router } from "express";
import WorkflowController from "../controllers/WorkflowController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

/**
 * @openapi
 * /docgen/workflows/type/{typeId}:
 *   get:
 *     tags: [DocGen - Workflows]
 *     summary: Récupère les workflows par type de document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: typeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Workflows du type
 */
router.get('/type/:typeId', [Authenticate], WorkflowController.getByType);

/**
 * @openapi
 * /docgen/workflows:
 *   post:
 *     tags: [DocGen - Workflows]
 *     summary: Crée ou met à jour un workflow
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
 *               etapes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Workflow sauvegardé
 */
router.post('/', [Authenticate], WorkflowController.save);

/**
 * @openapi
 * /docgen/workflows/{id}:
 *   delete:
 *     tags: [DocGen - Workflows]
 *     summary: Supprime un workflow
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
 *         description: Workflow supprimé
 */
router.delete('/:id', [Authenticate], WorkflowController.delete);

export default router;
