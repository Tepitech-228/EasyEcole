import express from "express"
import QuaReponseSatisfactionController from "../controllers/QuaReponseSatisfactionController"
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
.get('/', [Authenticate], QuaReponseSatisfactionController.getAll)
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
.get('/:id', [Authenticate], QuaReponseSatisfactionController.get)
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
.post('/', [Authenticate], QuaReponseSatisfactionController.create)
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
.put('/:id', [Authenticate], QuaReponseSatisfactionController.update)
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
.delete('/:id', [Authenticate], QuaReponseSatisfactionController.delete)

export default router
