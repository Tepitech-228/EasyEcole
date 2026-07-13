import express from "express"

import PrerequisParcoursController from "../controllers/PrerequisParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/prerequis-parcours:
     *   get:
     *     tags: [Prérequis parcours]
     *     summary: Liste tous les prérequis des parcours
     *     responses:
     *       200:
     *         description: Liste des prérequis
     */
    .get('/', PrerequisParcoursController.getAllPrerequisParcours)
    /**
     * @openapi
     * /orientation/prerequis-parcours:
     *   post:
     *     tags: [Prérequis parcours]
     *     summary: Crée un nouveau prérequis pour un parcours
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               parcoursId:
     *                 type: string
     *               matierePrerequisId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Prérequis créé
     */
    .post('/', [AuthInstitution, CheckPermission('action.orientation.prerequis.creer')], PrerequisParcoursController.createPrerequisParcours)
    /**
     * @openapi
     * /orientation/prerequis-parcours/{id}:
     *   get:
     *     tags: [Prérequis parcours]
     *     summary: Récupère un prérequis par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du prérequis
     */
    .get('/:id', PrerequisParcoursController.getPrerequisParcours)
    /**
     * @openapi
     * /orientation/prerequis-parcours/{id}:
     *   put:
     *     tags: [Prérequis parcours]
     *     summary: Met à jour un prérequis
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
     *               parcoursId:
     *                 type: string
     *               matierePrerequisId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Prérequis mis à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.orientation.prerequis.modifier')], PrerequisParcoursController.updatePrerequisParcours)
    /**
     * @openapi
     * /orientation/prerequis-parcours/{id}:
     *   delete:
     *     tags: [Prérequis parcours]
     *     summary: Supprime un prérequis
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Prérequis supprimé
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.orientation.prerequis.supprimer')], PrerequisParcoursController.deletePrerequisParcours)
    /**
     * @openapi
     * /orientation/prerequis-parcours/statistics/count:
     *   get:
     *     tags: [Prérequis parcours]
     *     summary: Retourne le nombre total de prérequis
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de prérequis
     */
    .get('/statistics/count', [AuthInstitution], PrerequisParcoursController.getCount)

export default router