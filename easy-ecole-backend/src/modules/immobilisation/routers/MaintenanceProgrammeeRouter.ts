import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import MaintenanceProgrammeeController from "../controllers/MaintenanceProgrammeeController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/maintenances-programmees:
     *   get:
     *     tags: [Maintenances programmées]
     *     summary: Liste toutes les maintenances programmées
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des maintenances programmées
     */
    .get('/', [Authenticate], MaintenanceProgrammeeController.getAll)
    /**
     * @openapi
     * /immobilisations/maintenances-programmees/{id}:
     *   get:
     *     tags: [Maintenances programmées]
     *     summary: Détail d'une maintenance programmée
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
     *         description: Détail de la maintenance programmée
     */
    .get('/:id', [Authenticate], MaintenanceProgrammeeController.get)
    /**
     * @openapi
     * /immobilisations/maintenances-programmees:
     *   post:
     *     tags: [Maintenances programmées]
     *     summary: Crée une maintenance programmée
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
     *         description: Maintenance programmée créée
     */
    .post('/', [Authenticate], MaintenanceProgrammeeController.create)
    /**
     * @openapi
     * /immobilisations/maintenances-programmees/{id}:
     *   put:
     *     tags: [Maintenances programmées]
     *     summary: Met à jour une maintenance programmée
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
     *         description: Maintenance programmée mise à jour
     */
    .put('/:id', [Authenticate], MaintenanceProgrammeeController.update)
    /**
     * @openapi
     * /immobilisations/maintenances-programmees/{id}:
     *   delete:
     *     tags: [Maintenances programmées]
     *     summary: Supprime une maintenance programmée
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
     *         description: Maintenance programmée supprimée
     */
    .delete('/:id', [Authenticate], MaintenanceProgrammeeController.delete)
export default router;
