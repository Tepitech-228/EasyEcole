import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AffectationController from "../controllers/AffectationController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/affectations:
     *   get:
     *     tags: [Affectations]
     *     summary: Liste toutes les affectations
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des affectations
     */
    .get('/', [Authenticate], AffectationController.getAll)
    /**
     * @openapi
     * /immobilisations/affectations/by-immobilisation/{immobilisationId}:
     *   get:
     *     tags: [Affectations]
     *     summary: Liste les affectations d'une immobilisation
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: immobilisationId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Liste des affectations de l'immobilisation
     */
    .get('/by-immobilisation/:immobilisationId', [Authenticate], AffectationController.getByImmobilisation)
    /**
     * @openapi
     * /immobilisations/affectations/current/{immobilisationId}:
     *   get:
     *     tags: [Affectations]
     *     summary: Récupère l'affectation en cours d'une immobilisation
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: immobilisationId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Affectation en cours
     */
    .get('/current/:immobilisationId', [Authenticate], AffectationController.getCurrent)
    /**
     * @openapi
     * /immobilisations/affectations/{id}:
     *   get:
     *     tags: [Affectations]
     *     summary: Détail d'une affectation
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
     *         description: Détail de l'affectation
     */
    .get('/:id', [Authenticate], AffectationController.get)
    /**
     * @openapi
     * /immobilisations/affectations:
     *   post:
     *     tags: [Affectations]
     *     summary: Crée une affectation
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
     *         description: Affectation créée
     */
    .post('/', [Authenticate], AffectationController.create)
    /**
     * @openapi
     * /immobilisations/affectations/{id}:
     *   put:
     *     tags: [Affectations]
     *     summary: Met à jour une affectation
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
     *         description: Affectation mise à jour
     */
    .put('/:id', [Authenticate], AffectationController.update)
    /**
     * @openapi
     * /immobilisations/affectations/{id}:
     *   delete:
     *     tags: [Affectations]
     *     summary: Supprime une affectation
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
     *         description: Affectation supprimée
     */
    .delete('/:id', [Authenticate], AffectationController.delete)
export default router;
