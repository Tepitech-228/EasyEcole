import express from "express";
import Authenticate from "../../../core/middlewares/Authenticate";
import AcquisitionController from "../controllers/AcquisitionController";
const router = express.Router();
router
    /**
     * @openapi
     * /immobilisations/acquisitions:
     *   get:
     *     tags: [Acquisitions]
     *     summary: Liste toutes les acquisitions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Liste des acquisitions
     */
    .get('/', [Authenticate], AcquisitionController.getAll)
    /**
     * @openapi
     * /immobilisations/acquisitions/{id}:
     *   get:
     *     tags: [Acquisitions]
     *     summary: Détail d'une acquisition
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
     *         description: Détail de l'acquisition
     */
    .get('/:id', [Authenticate], AcquisitionController.get)
    /**
     * @openapi
     * /immobilisations/acquisitions:
     *   post:
     *     tags: [Acquisitions]
     *     summary: Crée une acquisition
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
     *         description: Acquisition créée
     */
    .post('/', [Authenticate], AcquisitionController.create)
    /**
     * @openapi
     * /immobilisations/acquisitions/{id}:
     *   put:
     *     tags: [Acquisitions]
     *     summary: Met à jour une acquisition
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
     *         description: Acquisition mise à jour
     */
    .put('/:id', [Authenticate], AcquisitionController.update)
    /**
     * @openapi
     * /immobilisations/acquisitions/{id}:
     *   delete:
     *     tags: [Acquisitions]
     *     summary: Supprime une acquisition
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
     *         description: Acquisition supprimée
     */
    .delete('/:id', [Authenticate], AcquisitionController.delete)
export default router;
