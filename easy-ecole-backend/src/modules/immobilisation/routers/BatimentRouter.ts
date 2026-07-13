import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import BatimentController from "../controllers/BatimentController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/batiments:
     *   get:
     *     tags: [Bâtiments]
     *     summary: Liste tous les bâtiments
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des bâtiments
     */
    .get('/', [Authenticate], BatimentController.getAll)
    /**
     * @openapi
     * /immobilisations/batiments/{id}:
     *   get:
     *     tags: [Bâtiments]
     *     summary: Détail d'un bâtiment
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
     *         description: Détail du bâtiment
     */
    .get('/:id', [Authenticate], BatimentController.get)
    /**
     * @openapi
     * /immobilisations/batiments:
     *   post:
     *     tags: [Bâtiments]
     *     summary: Crée un bâtiment
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
     *         description: Bâtiment créé
     */
    .post('/', [Authenticate], BatimentController.create)
    /**
     * @openapi
     * /immobilisations/batiments/{id}:
     *   put:
     *     tags: [Bâtiments]
     *     summary: Met à jour un bâtiment
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
     *         description: Bâtiment mis à jour
     */
    .put('/:id', [Authenticate], BatimentController.update)
    /**
     * @openapi
     * /immobilisations/batiments/{id}:
     *   delete:
     *     tags: [Bâtiments]
     *     summary: Supprime un bâtiment
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
     *         description: Bâtiment supprimé
     */
    .delete('/:id', [Authenticate], BatimentController.delete)
export default router;
