import express from "express"

import CahierDeTexteController from "../controllers/CahierDeTexteController"

const router = express.Router()

/**
 * @openapi
 * /inscription/cahiersDeTexte:
 *   get:
 *     tags: [Cahiers de Texte]
 *     summary: Liste tous les cahiers de texte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des cahiers de texte
 */
router
    .get('/', CahierDeTexteController.getAllCahiersDeTexte)

/**
 * @openapi
 * /inscription/cahiersDeTexte:
 *   post:
 *     tags: [Cahiers de Texte]
 *     summary: Crée un nouveau cahier de texte
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
 *         description: Cahier de texte créé
 */
    .post('/', [], CahierDeTexteController.createCahierDeTexte)

/**
 * @openapi
 * /inscription/cahiersDeTexte/{id}:
 *   get:
 *     tags: [Cahiers de Texte]
 *     summary: Récupère un cahier de texte par ID
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
 *         description: Cahier de texte trouvé
 */
    .get('/:id', CahierDeTexteController.getCahierDeTexte)

/**
 * @openapi
 * /inscription/cahiersDeTexte/{id}:
 *   put:
 *     tags: [Cahiers de Texte]
 *     summary: Met à jour un cahier de texte
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
 *         description: Cahier de texte mis à jour
 */
    .put('/:id', [], CahierDeTexteController.updateCahierDeTexte)

/**
 * @openapi
 * /inscription/cahiersDeTexte/{id}:
 *   delete:
 *     tags: [Cahiers de Texte]
 *     summary: Supprime un cahier de texte
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
 *         description: Cahier de texte supprimé
 */
    .delete('/:id', [], CahierDeTexteController.deleteCahierDeTexte)

/**
 * @openapi
 * /inscription/cahiersDeTexte/statistics/count:
 *   get:
 *     tags: [Cahiers de Texte]
 *     summary: Compte le nombre de cahiers de texte
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de cahiers de texte
 */
    .get('/statistics/count', [], CahierDeTexteController.getCount)

export default router