import express from "express";
import ProcessusGenerateurController from "../controllers/ProcessusGenerateurController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import { AuthAdmin } from "../../../core/middlewares/AuthAdmin";

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
.get('/', [Authenticate], ProcessusGenerateurController.list)
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
.get('/:id', [Authenticate], ProcessusGenerateurController.get)
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
.post('/', [Authenticate, AuthInstitution], ProcessusGenerateurController.create)
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
.put('/:id', [Authenticate, AuthInstitution], ProcessusGenerateurController.update)
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
.delete('/:id', [Authenticate, AuthAdmin], ProcessusGenerateurController.delete)

export default router;
