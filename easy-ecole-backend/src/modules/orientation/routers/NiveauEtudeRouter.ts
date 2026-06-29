import express from "express"

import NiveauEtudeController from "../controllers/NiveauEtudeController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/niveaux-etude:
     *   get:
     *     tags: [Niveaux d'étude]
     *     summary: Liste tous les niveaux d'étude
     *     responses:
     *       200:
     *         description: Liste des niveaux d'étude
     */
    .get('/', NiveauEtudeController.getAllNiveauxEtude)
    /**
     * @openapi
     * /orientation/niveaux-etude:
     *   post:
     *     tags: [Niveaux d'étude]
     *     summary: Crée un nouveau niveau d'étude
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
     *         description: Niveau d'étude créé
     */
    .post('/', [AuthInstitution, CheckPermission('action.orientation.niveau-etude.creer')], NiveauEtudeController.createNiveauEtude)
    /**
     * @openapi
     * /orientation/niveaux-etude/{id}:
     *   get:
     *     tags: [Niveaux d'étude]
     *     summary: Récupère un niveau d'étude par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du niveau d'étude
     */
    .get('/:id', NiveauEtudeController.getNiveauEtude)
    /**
     * @openapi
     * /orientation/niveaux-etude/{id}:
     *   put:
     *     tags: [Niveaux d'étude]
     *     summary: Met à jour un niveau d'étude
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
     *         description: Niveau d'étude mis à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.orientation.niveau-etude.modifier')], NiveauEtudeController.updateNiveauEtude)
    /**
     * @openapi
     * /orientation/niveaux-etude/{id}:
     *   delete:
     *     tags: [Niveaux d'étude]
     *     summary: Supprime un niveau d'étude
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Niveau d'étude supprimé
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.orientation.niveau-etude.supprimer')], NiveauEtudeController.deleteNiveauEtude)
    /**
     * @openapi
     * /orientation/niveaux-etude/statistics/count:
     *   get:
     *     tags: [Niveaux d'étude]
     *     summary: Retourne le nombre total de niveaux d'étude
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de niveaux d'étude
     */
    .get('/statistics/count', [AuthInstitution], NiveauEtudeController.getCount)

export default router