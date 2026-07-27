import express from "express"
import ManifestationInteretController from "../controllers/ManifestationInteretController"

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
.get('/', ManifestationInteretController.getAll)
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
.post('/', ManifestationInteretController.create)
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
.get('/:id', ManifestationInteretController.get)
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
.put('/:id', ManifestationInteretController.update)
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
.delete('/:id', ManifestationInteretController.delete)
        /**
     * @openapi
     * /:id/soumettre:
     *   post:
     *     tags: [Marche]
     *     summary: POST /:id/soumettre
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/soumettre', ManifestationInteretController.soumettre)
        /**
     * @openapi
     * /:id/retenir:
     *   post:
     *     tags: [Marche]
     *     summary: POST /:id/retenir
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/:id/retenir', ManifestationInteretController.retenir)

export default router
