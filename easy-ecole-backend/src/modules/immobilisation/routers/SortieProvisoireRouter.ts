import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import SortieProvisoireController from "../controllers/SortieProvisoireController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/sorties-provisoires:
     *   get:
     *     tags: [SortiesProvisoires]
     *     summary: Liste toutes les sorties provisoires
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des sorties provisoires
     */
    .get('/', [Authenticate], SortieProvisoireController.getAll)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires/by-immobilisation/{immobilisationId}:
     *   get:
     *     tags: [SortiesProvisoires]
     *     summary: Liste les sorties provisoires par immobilisation
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
     *         description: Liste des sorties provisoires de l'immobilisation
     */
    .get('/by-immobilisation/:immobilisationId', [Authenticate], SortieProvisoireController.getByImmobilisation)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires/{id}:
     *   get:
     *     tags: [SortiesProvisoires]
     *     summary: Détail d'une sortie provisoire
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
     *         description: Détail de la sortie provisoire
     */
    .get('/:id', [Authenticate], SortieProvisoireController.get)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires:
     *   post:
     *     tags: [SortiesProvisoires]
     *     summary: Crée une sortie provisoire
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
     *         description: Sortie provisoire créée
     */
    .post('/', [Authenticate], SortieProvisoireController.create)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires/{id}:
     *   put:
     *     tags: [SortiesProvisoires]
     *     summary: Met à jour une sortie provisoire
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
     *         description: Sortie provisoire mise à jour
     */
    .put('/:id', [Authenticate], SortieProvisoireController.update)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires/{id}/retour:
     *   patch:
     *     tags: [SortiesProvisoires]
     *     summary: Marque le retour d'une sortie provisoire
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
     *         description: Retour enregistré
     */
    .patch('/:id/retour', [Authenticate], SortieProvisoireController.retour)
    /**
     * @openapi
     * /immobilisations/sorties-provisoires/{id}:
     *   delete:
     *     tags: [SortiesProvisoires]
     *     summary: Supprime une sortie provisoire
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
     *         description: Sortie provisoire supprimée
     */
    .delete('/:id', [Authenticate], SortieProvisoireController.delete)
export default router;
