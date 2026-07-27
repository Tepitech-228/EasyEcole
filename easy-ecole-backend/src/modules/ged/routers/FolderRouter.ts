import express from 'express';
import FolderController from '../controllers/FolderController';
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
.get('/', [Authenticate], FolderController.list)
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
.post('/', [Authenticate, AuthInstitution], FolderController.create)
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
.put('/:id', [Authenticate, AuthInstitution], FolderController.update)
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
.delete('/:id', [Authenticate, AuthInstitution], FolderController.remove)

export default router;
