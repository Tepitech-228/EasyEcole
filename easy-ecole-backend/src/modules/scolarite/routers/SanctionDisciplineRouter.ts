import express from "express"
import SanctionDisciplineController from "../controllers/SanctionDisciplineController"

const router = express.Router()

/**
 * @openapi
 * /scolarite/discipline:
 *   get:
 *     tags: [Sanctions Disciplinaires]
 *     summary: Liste toutes les sanctions disciplinaires
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sanctions disciplinaires
 */
router
    .get('/', SanctionDisciplineController.getAll)

/**
 * @openapi
 * /scolarite/discipline:
 *   post:
 *     tags: [Sanctions Disciplinaires]
 *     summary: Crée une nouvelle sanction disciplinaire
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
 *         description: Sanction disciplinaire créée
 */
    .post('/', SanctionDisciplineController.create)

/**
 * @openapi
 * /scolarite/discipline/{id}:
 *   get:
 *     tags: [Sanctions Disciplinaires]
 *     summary: Récupère une sanction disciplinaire par ID
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
 *         description: Sanction disciplinaire trouvée
 */
    .get('/:id', SanctionDisciplineController.getOne)

/**
 * @openapi
 * /scolarite/discipline/{id}:
 *   put:
 *     tags: [Sanctions Disciplinaires]
 *     summary: Met à jour une sanction disciplinaire
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
 *         description: Sanction disciplinaire mise à jour
 */
    .put('/:id', SanctionDisciplineController.update)

/**
 * @openapi
 * /scolarite/discipline/{id}:
 *   delete:
 *     tags: [Sanctions Disciplinaires]
 *     summary: Supprime une sanction disciplinaire
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
 *         description: Sanction disciplinaire supprimée
 */
    .delete('/:id', SanctionDisciplineController.delete)

export default router
