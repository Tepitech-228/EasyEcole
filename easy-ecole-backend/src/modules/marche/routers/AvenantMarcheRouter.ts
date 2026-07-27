import express from "express"
import AvenantMarcheController from "../controllers/AvenantMarcheController"

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
.get('/', AvenantMarcheController.getAll)
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
.post('/', AvenantMarcheController.create)
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
.get('/:id', AvenantMarcheController.get)
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
.put('/:id', AvenantMarcheController.update)
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
.delete('/:id', AvenantMarcheController.delete)

export default router
