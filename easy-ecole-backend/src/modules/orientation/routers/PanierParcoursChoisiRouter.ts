import express from "express"

import PanierParcoursChoisiController from "../controllers/PanierParcoursChoisiController"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/panier-parcours-choisi:
     *   get:
     *     tags: [Panier parcours choisis]
     *     summary: Liste tous les éléments du panier de parcours choisis
     *     responses:
     *       200:
     *         description: Liste du panier
     */
    .get('/', PanierParcoursChoisiController.getAllPanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi:
     *   post:
     *     tags: [Panier parcours choisis]
     *     summary: Ajoute un parcours choisi au panier
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               parcoursChoisiId:
     *                 type: string
     *               etudiantId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Élément ajouté au panier
     */
    .post('/', [], PanierParcoursChoisiController.createPanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi/{id}:
     *   get:
     *     tags: [Panier parcours choisis]
     *     summary: Récupère un élément du panier par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'élément du panier
     */
    .get('/:id', PanierParcoursChoisiController.getPanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi/{id}:
     *   put:
     *     tags: [Panier parcours choisis]
     *     summary: Met à jour un élément du panier
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
     *               parcoursChoisiId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Élément du panier mis à jour
     */
    .put('/:id', [], PanierParcoursChoisiController.updatePanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi/{id}:
     *   delete:
     *     tags: [Panier parcours choisis]
     *     summary: Supprime un élément du panier
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Élément du panier supprimé
     */
    .delete('/:id', [], PanierParcoursChoisiController.deletePanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi:
     *   delete:
     *     tags: [Panier parcours choisis]
     *     summary: Supprime tous les éléments du panier
     *     responses:
     *       200:
     *         description: Panier vidé
     */
    .delete('/', [], PanierParcoursChoisiController.deleteAllPanierParcoursChoisi)
    /**
     * @openapi
     * /orientation/panier-parcours-choisi/statistics/count:
     *   get:
     *     tags: [Panier parcours choisis]
     *     summary: Retourne le nombre total d'éléments dans le panier
     *     responses:
     *       200:
     *         description: Nombre d'éléments dans le panier
     */
    .get('/statistics/count', [], PanierParcoursChoisiController.getCount)

export default router