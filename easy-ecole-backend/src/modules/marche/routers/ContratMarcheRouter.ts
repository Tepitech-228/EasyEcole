import express from "express"
import ContratMarcheController from "../controllers/ContratMarcheController"

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
.get('/', ContratMarcheController.getAll)
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
.post('/', ContratMarcheController.create)
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
.get('/:id', ContratMarcheController.get)
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
.put('/:id', ContratMarcheController.update)
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
.delete('/:id', ContratMarcheController.delete)
        /**
     * @openapi
     * /:id/signer:
     *   post:
     *     tags: [Marche]
     *     summary: POST /:id/signer
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/signer', ContratMarcheController.signer)

export default router
