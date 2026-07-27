import express from "express"
import PlanificationMarcheController from "../controllers/PlanificationMarcheController"

const router = express.Router()

router
        /**
     * @openapi
     * /:
     *   get:
     *     tags: [Marche]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', PlanificationMarcheController.getAll)
        /**
     * @openapi
     * /:
     *   post:
     *     tags: [Marche]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', PlanificationMarcheController.create)
        /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [Marche]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', PlanificationMarcheController.get)
        /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [Marche]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', PlanificationMarcheController.update)
        /**
     * @openapi
     * /:id:
     *   delete:
     *     tags: [Marche]
     *     summary: DELETE /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/:id', PlanificationMarcheController.delete)

export default router
