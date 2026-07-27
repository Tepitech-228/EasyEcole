import express from "express"
import QuaAuditController from "../controllers/QuaAuditController"
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
.get('/', [Authenticate], QuaAuditController.getAll)
      /**
     * @openapi
     * /count:
     *   get:
     *     tags: [Qualite]
     *     summary: GET /count
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/count', [Authenticate], QuaAuditController.getCount)
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
.get('/:id', [Authenticate], QuaAuditController.get)
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
.post('/', [Authenticate], QuaAuditController.create)
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
.put('/:id', [Authenticate], QuaAuditController.update)
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
.delete('/:id', [Authenticate], QuaAuditController.delete)

export default router
