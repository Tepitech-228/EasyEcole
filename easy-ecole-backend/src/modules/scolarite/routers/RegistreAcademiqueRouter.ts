import express from "express"
import RegistreAcademiqueController from "../controllers/RegistreAcademiqueController"

const router = express.Router()

/**
 * @openapi
 * /scolarite/registres:
 *   get:
 *     tags: [Registres Académiques]
 *     summary: Liste tous les registres académiques
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des registres académiques
 */
router
    .get('/', RegistreAcademiqueController.getAll)

/**
 * @openapi
 * /scolarite/registres:
 *   post:
 *     tags: [Registres Académiques]
 *     summary: Crée un nouveau registre académique
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
 *         description: Registre académique créé
 */
    .post('/', RegistreAcademiqueController.create)

/**
 * @openapi
 * /scolarite/registres/{id}:
 *   get:
 *     tags: [Registres Académiques]
 *     summary: Récupère un registre académique par ID
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
 *         description: Registre académique trouvé
 */
    .get('/:id', RegistreAcademiqueController.getOne)

/**
 * @openapi
 * /scolarite/registres/{id}:
 *   put:
 *     tags: [Registres Académiques]
 *     summary: Met à jour un registre académique
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
 *         description: Registre académique mis à jour
 */
    .put('/:id', RegistreAcademiqueController.update)

/**
 * @openapi
 * /scolarite/registres/{id}:
 *   delete:
 *     tags: [Registres Académiques]
 *     summary: Supprime un registre académique
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
 *         description: Registre académique supprimé
 */
    .delete('/:id', RegistreAcademiqueController.delete)

export default router
