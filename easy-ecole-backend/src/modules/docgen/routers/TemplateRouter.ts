import { Router } from "express";
import TemplateController from "../controllers/TemplateController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

/**
 * @openapi
 * /docgen/templates:
 *   get:
 *     tags: [DocGen - Templates]
 *     summary: Liste tous les templates HTML
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des templates
 */
router.get('/', [Authenticate], TemplateController.getAll);

/**
 * @openapi
 * /docgen/templates/{id}:
 *   get:
 *     tags: [DocGen - Templates]
 *     summary: Récupère un template par ID
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
 *         description: Template trouvé
 */
router.get('/:id', [Authenticate], TemplateController.getById);

/**
 * @openapi
 * /docgen/templates:
 *   post:
 *     tags: [DocGen - Templates]
 *     summary: Crée un nouveau template
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               libelle:
 *                 type: string
 *               contenuHtml:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template créé
 */
router.post('/', [Authenticate], TemplateController.create);

/**
 * @openapi
 * /docgen/templates/{id}:
 *   put:
 *     tags: [DocGen - Templates]
 *     summary: Met à jour un template
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
 *         description: Template mis à jour
 */
router.put('/:id', [Authenticate], TemplateController.update);

/**
 * @openapi
 * /docgen/templates/{id}:
 *   delete:
 *     tags: [DocGen - Templates]
 *     summary: Supprime un template
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
 *         description: Template supprimé
 */
router.delete('/:id', [Authenticate], TemplateController.delete);

/**
 * @openapi
 * /docgen/templates/preview:
 *   post:
 *     tags: [DocGen - Templates]
 *     summary: Prévisualise un template avec des données
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenuHtml:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Aperçu HTML généré
 */
router.post('/preview', [Authenticate], TemplateController.preview);

export default router;
