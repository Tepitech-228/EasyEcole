import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import SiteController from "../controllers/SiteController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/sites:
     *   get:
     *     tags: [Sites]
     *     summary: Liste tous les sites
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des sites
     */
    .get('/', [Authenticate], SiteController.getAll)
    /**
     * @openapi
     * /immobilisations/sites/{id}:
     *   get:
     *     tags: [Sites]
     *     summary: Détail d'un site
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
     *         description: Détail du site
     */
    .get('/:id', [Authenticate], SiteController.get)
    /**
     * @openapi
     * /immobilisations/sites:
     *   post:
     *     tags: [Sites]
     *     summary: Crée un site
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
     *         description: Site créé
     */
    .post('/', [Authenticate], SiteController.create)
    /**
     * @openapi
     * /immobilisations/sites/{id}:
     *   put:
     *     tags: [Sites]
     *     summary: Met à jour un site
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
     *         description: Site mis à jour
     */
    .put('/:id', [Authenticate], SiteController.update)
    /**
     * @openapi
     * /immobilisations/sites/{id}:
     *   delete:
     *     tags: [Sites]
     *     summary: Supprime un site
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
     *         description: Site supprimé
     */
    .delete('/:id', [Authenticate], SiteController.delete)
export default router;
