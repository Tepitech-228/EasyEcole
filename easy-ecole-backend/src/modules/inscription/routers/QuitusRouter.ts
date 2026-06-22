import express from "express"

import QuitusController from "../controllers/QuitusController"

const router = express.Router()

router
    /**
     * @openapi
     * /inscription/quitus:
     *   get:
     *     tags: [Quitus]
     *     summary: Liste tous les quitus
     *     responses:
     *       200:
     *         description: Liste des quitus
     */
    .get('/', QuitusController.getAllQuitus)
    /**
     * @openapi
     * /inscription/quitus/generer:
     *   post:
     *     tags: [Quitus]
     *     summary: Génère un quitus pour un paiement
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               paiementInscriptionId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Quitus généré
     */
    .post('/generer', QuitusController.generateQuitus)
    /**
     * @openapi
     * /inscription/quitus/{id}:
     *   get:
     *     tags: [Quitus]
     *     summary: Récupère un quitus par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du quitus
     */
    .get('/:id', QuitusController.getQuitus)
    /**
     * @openapi
     * /inscription/quitus/{id}:
     *   put:
     *     tags: [Quitus]
     *     summary: Valide un quitus
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Quitus validé
     */
    .put('/:id', QuitusController.validerQuitus)
    /**
     * @openapi
     * /inscription/quitus/{id}:
     *   delete:
     *     tags: [Quitus]
     *     summary: Supprime un quitus
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Quitus supprimé
     */
    .delete('/:id', QuitusController.deleteQuitus)
    /**
     * @openapi
     * /inscription/quitus/statistics/count:
     *   get:
     *     tags: [Quitus]
     *     summary: Retourne le nombre total de quitus
     *     responses:
     *       200:
     *         description: Nombre de quitus
     */
    .get('/statistics/count', QuitusController.getCount)

export default router
