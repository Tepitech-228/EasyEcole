import express from "express"
import Authenticate from "../../../core/middlewares/Authenticate";
import EtablissementController from "../controllers/EtablissementController"

const router = express.Router()

router
        /**
     * @openapi
     * /:
     *   get:
     *     tags: [Etablissement]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], EtablissementController.getAll)
        /**
     * @openapi
     * /:
     *   post:
     *     tags: [Etablissement]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', [Authenticate], EtablissementController.create)
        /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [Etablissement]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', [Authenticate], EtablissementController.get)
        /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [Etablissement]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', [Authenticate], EtablissementController.update)
        /**
     * @openapi
     * /:id:
     *   delete:
     *     tags: [Etablissement]
     *     summary: DELETE /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/:id', [Authenticate], EtablissementController.delete)

export default router
