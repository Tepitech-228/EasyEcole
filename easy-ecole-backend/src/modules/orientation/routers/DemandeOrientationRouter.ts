import express from "express"

import DemandeOrientationController from "../controllers/DemandeOrientationController"

const router = express.Router()

router
    /**
     * @openapi
     * /orientation/demandes-orientation:
     *   get:
     *     tags: [Demandes d'orientation]
     *     summary: Liste toutes les demandes d'orientation
     *     responses:
     *       200:
     *         description: Liste des demandes d'orientation
     */
    .get('/', DemandeOrientationController.getAllDemandesOrientation)
    /**
     * @openapi
     * /orientation/demandes-orientation:
     *   post:
     *     tags: [Demandes d'orientation]
     *     summary: Crée une nouvelle demande d'orientation
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
     *         description: Demande d'orientation créée
     */
    .post('/', [], DemandeOrientationController.createDemandeOrientation)
    /**
     * @openapi
     * /orientation/demandes-orientation/{id}:
     *   get:
     *     tags: [Demandes d'orientation]
     *     summary: Récupère une demande d'orientation par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de la demande d'orientation
     */
    .get('/:id', DemandeOrientationController.getDemandeOrientation)
    // .put('/:id', [], DemandeOrientationController.updateDemandeOrientation)
    /**
     * @openapi
     * /orientation/demandes-orientation/{id}:
     *   delete:
     *     tags: [Demandes d'orientation]
     *     summary: Supprime une demande d'orientation
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Demande d'orientation supprimée
     */
    .delete('/:id', [], DemandeOrientationController.deleteDemandeOrientation)
    /**
     * @openapi
     * /orientation/demandes-orientation/statistics/count:
     *   get:
     *     tags: [Demandes d'orientation]
     *     summary: Retourne le nombre total de demandes d'orientation
     *     responses:
     *       200:
     *         description: Nombre de demandes d'orientation
     */
    .get('/statistics/count', [], DemandeOrientationController.getCount)

export default router