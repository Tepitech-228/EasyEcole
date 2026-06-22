import express from "express"

import CaissierBanqueController from "../controllers/CaissierBanqueController"
import { AuthCaissierBanque } from "../../../core/middlewares/AuthCaissierBanque";

const router = express.Router()

/**
 * @openapi
 * /auth/caissiers-banque:
 *   get:
 *     tags: [Caissiers Banque]
 *     summary: Liste tous les caissiers banque
 *     responses:
 *       200:
 *         description: Liste des caissiers banque
 */
router
    .get('/', CaissierBanqueController.getAllCaissierBanques)
    /**
     * @openapi
     * /auth/caissiers-banque/{id}:
     *   get:
     *     tags: [Caissiers Banque]
     *     summary: Obtenir un caissier banque par ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Caissier banque trouvé
     *       404:
     *         description: Caissier banque non trouvé
     */
    .get('/:id', CaissierBanqueController.getCaissierBanque)
    /**
     * @openapi
     * /auth/caissiers-banque:
     *   put:
     *     tags: [Caissiers Banque]
     *     summary: Mettre à jour un caissier banque
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *     responses:
     *       200:
     *         description: Caissier banque mis à jour
     *       401:
     *         description: Non autorisé
     */
    .put('/', [AuthCaissierBanque], CaissierBanqueController.updateCaissierBanque)
    /**
     * @openapi
     * /auth/caissiers-banque:
     *   delete:
     *     tags: [Caissiers Banque]
     *     summary: Supprimer un caissier banque
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Caissier banque supprimé
     *       401:
     *         description: Non autorisé
     */
    .delete('/', [AuthCaissierBanque], CaissierBanqueController.deleteCaissierBanque)
    /**
     * @openapi
     * /auth/caissiers-banque/statistics/count:
     *   get:
     *     tags: [Caissiers Banque]
     *     summary: Nombre total de caissiers banque
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistiques
     *       401:
     *         description: Non autorisé
     */
    .get('/statistics/count', [AuthCaissierBanque], CaissierBanqueController.getCount)

export default router