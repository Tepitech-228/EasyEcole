import express from "express"
import RegistreAcademiqueController from "../controllers/RegistreAcademiqueController"

const router = express.Router()

/**
 * @openapi
 * /scolarite/registres:
 *   get:
 *     tags: [Registres Académiques]
 *     summary: Liste tous les registres académiques (liste plate paginée, ou Top N par promotion avec ?top=)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: top
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Classe les 50 (défaut) meilleurs étudiants de chaque promotion. Sans ce paramètre, retourne la liste plate paginée classique.
 *     responses:
 *       200:
 *         description: Liste des registres académiques (ou classement par promotion si top est fourni)
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
 * /scolarite/registres/generer:
 *   post:
 *     tags: [Registres Académiques]
 *     summary: Génère automatiquement les registres académiques depuis une délibération clôturée ou publiée
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliberationId
 *             properties:
 *               deliberationId: { type: number }
 *     responses:
 *       200:
 *         description: Récapitulatif de la génération { crees, maj, total }
 *       400:
 *         description: Délibération non clôturée / non publiée ou paramètre manquant
 *       404:
 *         description: Délibération non trouvée
 */
    .post('/generer', RegistreAcademiqueController.generer)

/**
 * @openapi
 * /scolarite/registres/batch/statut:
 *   put:
 *     tags: [Registres Académiques]
 *     summary: Met à jour la décision de plusieurs registres
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *               decision: { type: string }
 *     responses:
 *       200:
 *         description: Décisions mises à jour
 */
    .put('/batch/statut', RegistreAcademiqueController.batchStatut)

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
