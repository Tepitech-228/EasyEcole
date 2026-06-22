import express from "express"

import ListePresenceController from "../controllers/ListePresenceController"

const router = express.Router()

/**
 * @openapi
 * /inscription/listesPresences:
 *   get:
 *     tags: [Listes de Présence]
 *     summary: Liste toutes les listes de présence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des listes de présence
 */
router
    .get('/', ListePresenceController.getAllListesPresences)

/**
 * @openapi
 * /inscription/listesPresences:
 *   post:
 *     tags: [Listes de Présence]
 *     summary: Crée une nouvelle liste de présence
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
 *         description: Liste de présence créée
 */
    .post('/', [], ListePresenceController.createListePresence)

/**
 * @openapi
 * /inscription/listesPresences/{id}:
 *   get:
 *     tags: [Listes de Présence]
 *     summary: Récupère une liste de présence par ID
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
 *         description: Liste de présence trouvée
 */
    .get('/:id', ListePresenceController.getListePresence)

/**
 * @openapi
 * /inscription/listesPresences/{id}:
 *   put:
 *     tags: [Listes de Présence]
 *     summary: Met à jour une liste de présence
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
 *         description: Liste de présence mise à jour
 */
    .put('/:id', [], ListePresenceController.updateListePresence)

/**
 * @openapi
 * /inscription/listesPresences/{id}:
 *   delete:
 *     tags: [Listes de Présence]
 *     summary: Supprime une liste de présence
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
 *         description: Liste de présence supprimée
 */
    .delete('/:id', [], ListePresenceController.deleteListePresence)

/**
 * @openapi
 * /inscription/listesPresences/statistics/count:
 *   get:
 *     tags: [Listes de Présence]
 *     summary: Compte le nombre de listes de présence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de listes de présence
 */
    .get('/statistics/count', [], ListePresenceController.getCount)

export default router