import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import LocalisationController from "../controllers/LocalisationController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/localisations:
     *   get:
     *     tags: [Localisations]
     *     summary: Liste toutes les localisations
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des localisations
     */
    .get('/', [Authenticate], LocalisationController.getAll)
    /**
     * @openapi
     * /immobilisations/localisations/{id}:
     *   get:
     *     tags: [Localisations]
     *     summary: Détail d'une localisation
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
     *         description: Détail de la localisation
     */
    .get('/:id', [Authenticate], LocalisationController.get)
    /**
     * @openapi
     * /immobilisations/localisations:
     *   post:
     *     tags: [Localisations]
     *     summary: Crée une localisation
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
     *         description: Localisation créée
     */
    .post('/', [Authenticate], LocalisationController.create)
    /**
     * @openapi
     * /immobilisations/localisations/{id}:
     *   put:
     *     tags: [Localisations]
     *     summary: Met à jour une localisation
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
     *         description: Localisation mise à jour
     */
    .put('/:id', [Authenticate], LocalisationController.update)
    /**
     * @openapi
     * /immobilisations/localisations/{id}:
     *   delete:
     *     tags: [Localisations]
     *     summary: Supprime une localisation
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
     *         description: Localisation supprimée
     */
    .delete('/:id', [Authenticate], LocalisationController.delete)
export default router;
