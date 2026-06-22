import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MaintenanceController from "../controllers/MaintenanceController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/maintenances:
     *   get:
     *     tags: [Maintenances]
     *     summary: Liste toutes les maintenances
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des maintenances
     */
    .get('/', [Authenticate], MaintenanceController.getAll)
    /**
     * @openapi
     * /immobilisations/maintenances/{id}:
     *   get:
     *     tags: [Maintenances]
     *     summary: Détail d'une maintenance
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
     *         description: Détail de la maintenance
     */
    .get('/:id', [Authenticate], MaintenanceController.get)
    /**
     * @openapi
     * /immobilisations/maintenances:
     *   post:
     *     tags: [Maintenances]
     *     summary: Crée une maintenance
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
     *         description: Maintenance créée
     */
    .post('/', [Authenticate], MaintenanceController.create)
    /**
     * @openapi
     * /immobilisations/maintenances/{id}:
     *   put:
     *     tags: [Maintenances]
     *     summary: Met à jour une maintenance
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
     *         description: Maintenance mise à jour
     */
    .put('/:id', [Authenticate], MaintenanceController.update)
    /**
     * @openapi
     * /immobilisations/maintenances/{id}:
     *   delete:
     *     tags: [Maintenances]
     *     summary: Supprime une maintenance
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
     *         description: Maintenance supprimée
     */
    .delete('/:id', [Authenticate], MaintenanceController.delete)
export default router;
