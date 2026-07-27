import { Router } from "express";
import TypeController from "../controllers/TypeController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = Router();

/**
 * @openapi
 * /docgen/types:
 *   get:
 *     tags: [DocGen - Types de documents]
 *     summary: Liste tous les types de documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des types
 */
router.get('/', [Authenticate], TypeController.getAll);

/**
 * @openapi
 * /docgen/types/{id}:
 *   get:
 *     tags: [DocGen - Types de documents]
 *     summary: Récupère un type de document par ID
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
 *         description: Type trouvé
 */
router.get('/:id', [Authenticate], TypeController.getById);

/**
 * @openapi
 * /docgen/types:
 *   post:
 *     tags: [DocGen - Types de documents]
 *     summary: Crée un nouveau type de document
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
 *     responses:
 *       201:
 *         description: Type créé
 */
router.post('/', [Authenticate], TypeController.create);

/**
 * @openapi
 * /docgen/types/{id}:
 *   put:
 *     tags: [DocGen - Types de documents]
 *     summary: Met à jour un type de document
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
 *         description: Type mis à jour
 */
router.put('/:id', [Authenticate], TypeController.update);

/**
 * @openapi
 * /docgen/types/{id}:
 *   delete:
 *     tags: [DocGen - Types de documents]
 *     summary: Supprime un type de document
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
 *         description: Type supprimé
 */
router.delete('/:id', [Authenticate], TypeController.delete);

export default router;
