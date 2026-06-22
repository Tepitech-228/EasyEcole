import express from "express"

import MatierePrerequisController from "../controllers/MatierePrerequisController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/matieres-prerequis:
     *   get:
     *     tags: [Matières prérequis]
     *     summary: Liste toutes les matières prérequis
     *     responses:
     *       200:
     *         description: Liste des matières prérequis
     */
    .get('/', MatierePrerequisController.getAllMatieresPrerequis)
    /**
     * @openapi
     * /orientation/matieres-prerequis:
     *   post:
     *     tags: [Matières prérequis]
     *     summary: Crée une nouvelle matière prérequis
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nom:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Matière prérequis créée
     */
    .post('/', [AuthInstitution], MatierePrerequisController.createMatierePrerequis)
    /**
     * @openapi
     * /orientation/matieres-prerequis/{id}:
     *   get:
     *     tags: [Matières prérequis]
     *     summary: Récupère une matière prérequis par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la matière prérequis
     */
    .get('/:id', MatierePrerequisController.getMatierePrerequis)
    /**
     * @openapi
     * /orientation/matieres-prerequis/{id}:
     *   put:
     *     tags: [Matières prérequis]
     *     summary: Met à jour une matière prérequis
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
     *               nom:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Matière prérequis mise à jour
     */
    .put('/:id', [AuthInstitution], MatierePrerequisController.updateMatierePrerequis)
    /**
     * @openapi
     * /orientation/matieres-prerequis/{id}:
     *   delete:
     *     tags: [Matières prérequis]
     *     summary: Supprime une matière prérequis
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Matière prérequis supprimée
     */
    .delete('/:id', [AuthInstitution], MatierePrerequisController.deleteMatierePrerequis)
    /**
     * @openapi
     * /orientation/matieres-prerequis/statistics/count:
     *   get:
     *     tags: [Matières prérequis]
     *     summary: Retourne le nombre total de matières prérequis
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de matières prérequis
     */
    .get('/statistics/count', [AuthInstitution], MatierePrerequisController.getCount)

export default router