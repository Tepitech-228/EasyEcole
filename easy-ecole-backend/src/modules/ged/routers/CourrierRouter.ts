import express from 'express';
import CourrierController from '../controllers/CourrierController';
import Authenticate from '../../../core/middlewares/Authenticate';
import { AuthInstitution } from '../../../core/middlewares/AuthInstitution';

const router = express.Router();

router
      /**
     * @openapi
     * /:
     *   get:
     *     tags: [GED]
     *     summary: GET /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/', [Authenticate], CourrierController.list)
      /**
     * @openapi
     * /next-numero:
     *   get:
     *     tags: [GED]
     *     summary: GET /next-numero
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/next-numero', [Authenticate], CourrierController.getNextNumero)
      /**
     * @openapi
     * /export-csv:
     *   get:
     *     tags: [GED]
     *     summary: GET /export-csv
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/export-csv', [Authenticate], CourrierController.exportCsv)
      /**
     * @openapi
     * /:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/:id', [Authenticate], CourrierController.get)
      /**
     * @openapi
     * /:
     *   post:
     *     tags: [GED]
     *     summary: POST /
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/', [Authenticate, AuthInstitution], CourrierController.create)
      /**
     * @openapi
     * /:id:
     *   put:
     *     tags: [GED]
     *     summary: PUT /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/:id', [Authenticate, AuthInstitution], CourrierController.update)
      /**
     * @openapi
     * /:id:
     *   delete:
     *     tags: [GED]
     *     summary: DELETE /:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/:id', [Authenticate, AuthInstitution], CourrierController.remove)

export default router;
