import express from "express"

import NiveauEtudeController from "../controllers/NiveauEtudeController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

/**
 * @openapi
 * /inscription/niveauxEtude:
 *   get:
 *     tags: [Niveaux d'Étude]
 *     summary: Liste tous les niveaux d'étude
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des niveaux d'étude
 */
router
    .get('/', NiveauEtudeController.getAllNiveauxEtude)

/**
 * @openapi
 * /inscription/niveauxEtude:
 *   post:
 *     tags: [Niveaux d'Étude]
 *     summary: Crée un nouveau niveau d'étude
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
 *         description: Niveau d'étude créé
 */
    .post('/', [AuthInstitution], NiveauEtudeController.createNiveauEtude)

/**
 * @openapi
 * /inscription/niveauxEtude/{id}:
 *   get:
 *     tags: [Niveaux d'Étude]
 *     summary: Récupère un niveau d'étude par ID
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
 *         description: Niveau d'étude trouvé
 */
    .get('/:id', NiveauEtudeController.getNiveauEtude)

/**
 * @openapi
 * /inscription/niveauxEtude/{id}:
 *   put:
 *     tags: [Niveaux d'Étude]
 *     summary: Met à jour un niveau d'étude
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
 *         description: Niveau d'étude mis à jour
 */
    .put('/:id', [AuthInstitution], NiveauEtudeController.updateNiveauEtude)

/**
 * @openapi
 * /inscription/niveauxEtude/{id}:
 *   delete:
 *     tags: [Niveaux d'Étude]
 *     summary: Supprime un niveau d'étude
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
 *         description: Niveau d'étude supprimé
 */
    .delete('/:id', [AuthInstitution], NiveauEtudeController.deleteNiveauEtude)

/**
 * @openapi
 * /inscription/niveauxEtude/statistics/count:
 *   get:
 *     tags: [Niveaux d'Étude]
 *     summary: Compte le nombre de niveaux d'étude
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de niveaux d'étude
 */
    .get('/statistics/count', [AuthInstitution], NiveauEtudeController.getCount)

export default router