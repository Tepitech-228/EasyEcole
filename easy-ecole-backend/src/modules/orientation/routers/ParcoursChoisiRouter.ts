import express from "express"

import ParcoursChoisiController from "../controllers/ParcoursChoisiController"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/parcours-choisis:
     *   get:
     *     tags: [Parcours choisis]
     *     summary: Liste tous les parcours choisis par les étudiants
     *     responses:
     *       200:
     *         description: Liste des parcours choisis
     */
    .get('/', ParcoursChoisiController.getAllParcoursChoisis)
    /**
     * @openapi
     * /orientation/parcours-choisis:
     *   post:
     *     tags: [Parcours choisis]
     *     summary: Crée un nouveau parcours choisi
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               etudiantId:
     *                 type: string
     *               parcoursId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Parcours choisi créé
     */
    .post('/', [], ParcoursChoisiController.createParcoursChoisi)
    /**
     * @openapi
     * /orientation/parcours-choisis/{id}:
     *   get:
     *     tags: [Parcours choisis]
     *     summary: Récupère un parcours choisi par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du parcours choisi
     */
    .get('/:id', ParcoursChoisiController.getParcoursChoisi)
    /**
     * @openapi
     * /orientation/parcours-choisis/{id}:
     *   put:
     *     tags: [Parcours choisis]
     *     summary: Met à jour un parcours choisi
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
     *               etudiantId:
     *                 type: string
     *               parcoursId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Parcours choisi mis à jour
     */
    .put('/:id', [], ParcoursChoisiController.updateParcoursChoisi)
    /**
     * @openapi
     * /orientation/parcours-choisis/{id}:
     *   delete:
     *     tags: [Parcours choisis]
     *     summary: Supprime un parcours choisi
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Parcours choisi supprimé
     */
    .delete('/:id', [], ParcoursChoisiController.deleteParcoursChoisi)
    /**
     * @openapi
     * /orientation/parcours-choisis/statistics/count:
     *   get:
     *     tags: [Parcours choisis]
     *     summary: Retourne le nombre total de parcours choisis
     *     responses:
     *       200:
     *         description: Nombre de parcours choisis
     */
    .get('/statistics/count', [], ParcoursChoisiController.getCount)

export default router