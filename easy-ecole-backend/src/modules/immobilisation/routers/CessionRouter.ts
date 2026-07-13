import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import CessionController from "../controllers/CessionController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/cessions:
     *   get:
     *     tags: [Cessions]
     *     summary: Liste toutes les cessions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des cessions
     */
    .get('/', [Authenticate], CessionController.getAll)
    /**
     * @openapi
     * /immobilisations/cessions/{id}:
     *   get:
     *     tags: [Cessions]
     *     summary: Détail d'une cession
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
     *         description: Détail de la cession
     */
    .get('/:id', [Authenticate], CessionController.get)
    /**
     * @openapi
     * /immobilisations/cessions:
     *   post:
     *     tags: [Cessions]
     *     summary: Crée une cession
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
     *         description: Cession créée
     */
    .post('/', [Authenticate], CessionController.create)
    /**
     * @openapi
     * /immobilisations/cessions/{id}:
     *   put:
     *     tags: [Cessions]
     *     summary: Met à jour une cession
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
     *         description: Cession mise à jour
     */
    .put('/:id', [Authenticate], CessionController.update)
    /**
     * @openapi
     * /immobilisations/cessions/{id}:
     *   delete:
     *     tags: [Cessions]
     *     summary: Supprime une cession
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
     *         description: Cession supprimée
     */
    .delete('/:id', [Authenticate], CessionController.delete)
export default router;
