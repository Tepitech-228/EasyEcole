import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import DepartementController from "../controllers/DepartementController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/departements:
     *   get:
     *     tags: [Départements]
     *     summary: Liste tous les départements
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des départements
     */
    .get('/', [Authenticate], DepartementController.getAll)
    /**
     * @openapi
     * /immobilisations/departements/{id}:
     *   get:
     *     tags: [Départements]
     *     summary: Détail d'un département
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
     *         description: Détail du département
     */
    .get('/:id', [Authenticate], DepartementController.get)
    /**
     * @openapi
     * /immobilisations/departements:
     *   post:
     *     tags: [Départements]
     *     summary: Crée un département
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
     *         description: Département créé
     */
    .post('/', [Authenticate], DepartementController.create)
    /**
     * @openapi
     * /immobilisations/departements/{id}:
     *   put:
     *     tags: [Départements]
     *     summary: Met à jour un département
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
     *         description: Département mis à jour
     */
    .put('/:id', [Authenticate], DepartementController.update)
    /**
     * @openapi
     * /immobilisations/departements/{id}:
     *   delete:
     *     tags: [Départements]
     *     summary: Supprime un département
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
     *         description: Département supprimé
     */
    .delete('/:id', [Authenticate], DepartementController.delete)
export default router;
