import express from "express"
import ShiftController from "../controllers/ShiftController"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

router
    /**
     * @openapi
     * /inscription/shifts:
     *   get:
     *     tags: [Shifts]
     *     summary: Liste tous les shifts (filtre optionnel ?actif=true|false)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des shifts
     */
    .get('/', ShiftController.getAll)
    /**
     * @openapi
     * /inscription/shifts/{id}:
     *   get:
     *     tags: [Shifts]
     *     summary: Récupère un shift par son ID
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Détails du shift
     */
    .get('/:id', ShiftController.get)
    /**
     * @openapi
     * /inscription/shifts:
     *   post:
     *     tags: [Shifts]
     *     summary: Crée un shift (nom, heures, jours, actif)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       201:
     *         description: Shift créé
     */
    .post('/', [CheckPermission('action.pointage.shift.creer')], ShiftController.create)
    /**
     * @openapi
     * /inscription/shifts/{id}:
     *   put:
     *     tags: [Shifts]
     *     summary: Modifie un shift
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Shift modifié
     */
    .put('/:id', [CheckPermission('action.pointage.shift.modifier')], ShiftController.update)
    /**
     * @openapi
     * /inscription/shifts/{id}:
     *   delete:
     *     tags: [Shifts]
     *     summary: Supprime un shift
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Shift supprimé
     */
    .delete('/:id', [CheckPermission('action.pointage.shift.supprimer')], ShiftController.remove)

export default router
