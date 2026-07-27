import express from "express"
import QuaNonConformiteController from "../controllers/QuaNonConformiteController"
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
.get('/', [Authenticate], QuaNonConformiteController.getAll)
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
.get('/count', [Authenticate], QuaNonConformiteController.getCount)
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
.get('/:id', [Authenticate], QuaNonConformiteController.get)
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
.post('/', [Authenticate], QuaNonConformiteController.create)
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
.put('/:id', [Authenticate], QuaNonConformiteController.update)
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
.delete('/:id', [Authenticate], QuaNonConformiteController.delete)

export default router
