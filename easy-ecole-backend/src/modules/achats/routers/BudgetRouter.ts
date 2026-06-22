import express from "express"
import BudgetController from "../controllers/BudgetController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/budgets:
     *   get:
     *     tags: [Achats - Budgets]
     *     summary: Liste tous les budgets
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des budgets
     */
    .get('/', BudgetController.getAll)
    /**
     * @openapi
     * /achats/budgets:
     *   post:
     *     tags: [Achats - Budgets]
     *     summary: Crée un budget
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               departementId:
     *                 type: integer
     *               periode:
     *                 type: string
     *               montantAlloue:
     *                 type: number
     *               lignesBudget:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     categorieAchatId:
     *                       type: integer
     *                     montantAlloue:
     *                       type: number
     *     responses:
     *       201:
     *         description: Budget créé
     */
    .post('/', BudgetController.create)
    /**
     * @openapi
     * /achats/budgets/{id}:
     *   get:
     *     tags: [Achats - Budgets]
     *     summary: Détails d'un budget
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Détails du budget
     */
    .get('/:id', BudgetController.get)
    /**
     * @openapi
     * /achats/budgets/{id}:
     *   put:
     *     tags: [Achats - Budgets]
     *     summary: Met à jour un budget
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Budget mis à jour
     */
    .put('/:id', BudgetController.update)
    /**
     * @openapi
     * /achats/budgets/{id}:
     *   delete:
     *     tags: [Achats - Budgets]
     *     summary: Supprime un budget
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Budget supprimé
     */
    .delete('/:id', BudgetController.delete)

export default router
