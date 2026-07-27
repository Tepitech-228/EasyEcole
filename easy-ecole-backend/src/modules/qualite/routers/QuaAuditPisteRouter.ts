import express from "express"
import QuaAuditPisteController from "../controllers/QuaAuditPisteController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
      /**
     * @openapi
     * /:
     *   get:
     *     tags: [Qualite]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], QuaAuditPisteController.getAll)
      /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [Qualite]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', [Authenticate], QuaAuditPisteController.get)
      /**
     * @openapi
     * /:
     *   post:
     *     tags: [Qualite]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', [Authenticate], QuaAuditPisteController.create)
      /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [Qualite]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', [Authenticate], QuaAuditPisteController.update)
      /**
     * @openapi
     * /:id:
     *   delete:
     *     tags: [Qualite]
     *     summary: DELETE /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/:id', [Authenticate], QuaAuditPisteController.delete)

export default router
