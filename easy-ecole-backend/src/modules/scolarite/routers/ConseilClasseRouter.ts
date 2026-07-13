import express from "express"
import ConseilClasseController from "../controllers/ConseilClasseController"

const router = express.Router()

/**
 * @openapi
 * /scolarite/conseils:
 *   get:
 *     tags: [Conseils de Classe]
 *     summary: Liste tous les conseils de classe
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conseils de classe
 */
router
    .get('/', ConseilClasseController.getAll)

/**
 * @openapi
 * /scolarite/conseils:
 *   post:
 *     tags: [Conseils de Classe]
 *     summary: Crée un nouveau conseil de classe
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
 *         description: Conseil de classe créé
 */
    .post('/', ConseilClasseController.create)

/**
 * @openapi
 * /scolarite/conseils/{id}:
 *   get:
 *     tags: [Conseils de Classe]
 *     summary: Récupère un conseil de classe par ID
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
 *         description: Conseil de classe trouvé
 */
    .get('/:id', ConseilClasseController.getOne)

/**
 * @openapi
 * /scolarite/conseils/{id}:
 *   put:
 *     tags: [Conseils de Classe]
 *     summary: Met à jour un conseil de classe
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
 *         description: Conseil de classe mis à jour
 */
    .put('/:id', ConseilClasseController.update)

/**
 * @openapi
 * /scolarite/conseils/{id}:
 *   delete:
 *     tags: [Conseils de Classe]
 *     summary: Supprime un conseil de classe
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
 *         description: Conseil de classe supprimé
 */
    .delete('/:id', ConseilClasseController.delete)

export default router
