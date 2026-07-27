import express from "express"
import AppelOffreController from "../controllers/AppelOffreController"

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
.get('/', AppelOffreController.getAll)
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
.post('/', AppelOffreController.create)
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
.get('/:id', AppelOffreController.get)
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
.put('/:id', AppelOffreController.update)
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
.delete('/:id', AppelOffreController.delete)
        /**
     * @openapi
     * /:id/lancer:
     *   post:
     *     tags: [Marche]
     *     summary: POST /:id/lancer
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/lancer', AppelOffreController.lancer)
        /**
     * @openapi
     * /:id/attribuer:
     *   post:
     *     tags: [Marche]
     *     summary: POST /:id/attribuer
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/attribuer', AppelOffreController.attribuer)

export default router
