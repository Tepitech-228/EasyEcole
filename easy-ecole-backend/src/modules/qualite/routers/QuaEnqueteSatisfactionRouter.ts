import express from "express"
import QuaEnqueteSatisfactionController from "../controllers/QuaEnqueteSatisfactionController"
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
.get('/', [Authenticate], QuaEnqueteSatisfactionController.getAll)
      /**
     * @openapi
     * /statistiques/:id:
     *   get:
     *     tags: [Qualite]
     *     summary: GET /statistiques/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/statistiques/:id', [Authenticate], QuaEnqueteSatisfactionController.getStatistiques)
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
.get('/:id', [Authenticate], QuaEnqueteSatisfactionController.get)
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
.post('/', [Authenticate], QuaEnqueteSatisfactionController.create)
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
.put('/:id', [Authenticate], QuaEnqueteSatisfactionController.update)
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
.delete('/:id', [Authenticate], QuaEnqueteSatisfactionController.delete)

export default router
