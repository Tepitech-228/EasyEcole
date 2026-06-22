import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import ImmobilisationController from "../controllers/ImmobilisationController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/immobilisations:
     *   get:
     *     tags: [Immobilisations]
     *     summary: Liste toutes les immobilisations
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des immobilisations
     */
    .get('/', [Authenticate], ImmobilisationController.getAll)
    /**
     * @openapi
     * /immobilisations/immobilisations/{id}:
     *   get:
     *     tags: [Immobilisations]
     *     summary: Détail d'une immobilisation
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
     *         description: Détail de l'immobilisation
     */
    .get('/:id', [Authenticate], ImmobilisationController.get)
    /**
     * @openapi
     * /immobilisations/immobilisations:
     *   post:
     *     tags: [Immobilisations]
     *     summary: Crée une immobilisation
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
     *         description: Immobilisation créée
     */
    .post('/', [Authenticate], ImmobilisationController.create)
    /**
     * @openapi
     * /immobilisations/immobilisations/{id}:
     *   put:
     *     tags: [Immobilisations]
     *     summary: Met à jour une immobilisation
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
     *         description: Immobilisation mise à jour
     */
    .put('/:id', [Authenticate], ImmobilisationController.update)
    /**
     * @openapi
     * /immobilisations/immobilisations/{id}:
     *   delete:
     *     tags: [Immobilisations]
     *     summary: Supprime une immobilisation
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
     *         description: Immobilisation supprimée
     */
    .delete('/:id', [Authenticate], ImmobilisationController.delete)
export default router;
