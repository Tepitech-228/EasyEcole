import express from "express"

import PrerequisParcoursChoisiController from "../controllers/PrerequisParcoursChoisiController"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi:
     *   get:
     *     tags: [Prérequis parcours choisis]
     *     summary: Liste tous les prérequis des parcours choisis
     *     responses:
     *       200:
     *         description: Liste des prérequis
     */
    .get('/', PrerequisParcoursChoisiController.getAllPrerequisParcoursChoisi)
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi:
     *   post:
     *     tags: [Prérequis parcours choisis]
     *     summary: Crée un nouveau prérequis pour parcours choisi
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               parcoursChoisiId:
     *                 type: string
     *               matierePrerequisId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Prérequis créé
     */
    .post('/', [], PrerequisParcoursChoisiController.createPrerequisParcoursChoisi)
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi/{id}:
     *   get:
     *     tags: [Prérequis parcours choisis]
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
    .get('/:id', PrerequisParcoursChoisiController.getPrerequisParcoursChoisi)
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi/{id}:
     *   put:
     *     tags: [Prérequis parcours choisis]
     *     summary: Met à jour un prérequis
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
     *               matierePrerequisId:
     *                 type: string
     *     responses:
     *       200:
     *         description: Prérequis mis à jour
     */
    .put('/:id', [], PrerequisParcoursChoisiController.updatePrerequisParcoursChoisi)
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi/{id}:
     *   delete:
     *     tags: [Prérequis parcours choisis]
     *     summary: Supprime un prérequis
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
    .delete('/:id', [], PrerequisParcoursChoisiController.deletePrerequisParcoursChoisi)
    /**
     * @openapi
     * /orientation/prerequis-parcours-choisi/statistics/count:
     *   get:
     *     tags: [Prérequis parcours choisis]
     *     summary: Retourne le nombre total de prérequis
     *     responses:
     *       200:
     *         description: Nombre de prérequis
     */
    .get('/statistics/count', [], PrerequisParcoursChoisiController.getCount)

export default router