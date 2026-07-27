import express from "express";
import ParentController from "./controllers/ParentController";
import Authenticate from "../../core/middlewares/Authenticate";

const router = express.Router();

router
    .use([Authenticate])
        /**
     * @openapi
     * /enfants:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants', ParentController.getEnfants)
        /**
     * @openapi
     * /enfants/:id/dashboard:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/dashboard
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/dashboard', ParentController.getDashboard)
        /**
     * @openapi
     * /enfants/:id/notes:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/notes
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/notes', ParentController.getNotes)
        /**
     * @openapi
     * /enfants/:id/absences:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/absences
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/absences', ParentController.getAbsences)
        /**
     * @openapi
     * /enfants/:id/emploi-du-temps:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/emploi-du-temps
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/emploi-du-temps', ParentController.getEmploiDuTemps)
        /**
     * @openapi
     * /enfants/:id/paiements:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/paiements
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/paiements', ParentController.getPaiements)
        /**
     * @openapi
     * /enfants/:id/documents:
     *   get:
     *     tags: [Parent]
     *     summary: GET /enfants/:id/documents
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/enfants/:id/documents', ParentController.getDocuments)

export default router;
