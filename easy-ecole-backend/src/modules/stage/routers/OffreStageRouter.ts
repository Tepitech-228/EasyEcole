import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import OffreStageController from "../controllers/OffreStageController";

const router = express.Router();
router
    /**
     * @openapi
     * /stages/offres:
     *   get:
     *     tags: [Offres de stage]
     *     summary: Liste toutes les offres de stage
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des offres de stage
     */
    .get('/', [Authenticate], OffreStageController.getAll)
    /**
     * @openapi
     * /stages/offres/{id}:
     *   get:
     *     tags: [Offres de stage]
     *     summary: Récupère une offre de stage par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'offre de stage
     */
    .get('/:id', [Authenticate], OffreStageController.get)
    /**
     * @openapi
     * /stages/offres:
     *   post:
     *     tags: [Offres de stage]
     *     summary: Crée une nouvelle offre de stage
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *               entrepriseId:
     *                 type: string
     *               dateDebut:
     *                 type: string
     *                 format: date
     *               dateFin:
     *                 type: string
     *                 format: date
     *     responses:
     *       201:
     *         description: Offre de stage créée
     */
    .post('/', [Authenticate], OffreStageController.create)
    /**
     * @openapi
     * /stages/offres/{id}:
     *   put:
     *     tags: [Offres de stage]
     *     summary: Met à jour une offre de stage
     *     security: [{ bearerAuth: [] }]
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
     *             properties:
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *               dateDebut:
     *                 type: string
     *                 format: date
     *               dateFin:
     *                 type: string
     *                 format: date
     *     responses:
     *       200:
     *         description: Offre de stage mise à jour
     */
    .put('/:id', [Authenticate], OffreStageController.update)
    /**
     * @openapi
     * /stages/offres/{id}:
     *   delete:
     *     tags: [Offres de stage]
     *     summary: Supprime une offre de stage
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Offre de stage supprimée
     */
    .delete('/:id', [Authenticate], OffreStageController.delete)
export default router;
