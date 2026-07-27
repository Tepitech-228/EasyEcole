import express from "express";
import StorageConfigController from "../controllers/StorageConfigController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";

const router = express.Router();

router
      /**
     * @openapi
     * /config:
     *   get:
     *     tags: [GED]
     *     summary: GET /config
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/config', [Authenticate], StorageConfigController.getConfig)
      /**
     * @openapi
     * /config:
     *   put:
     *     tags: [GED]
     *     summary: PUT /config
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/config', [Authenticate, AuthInstitution], StorageConfigController.updateConfig)
      /**
     * @openapi
     * /test:
     *   post:
     *     tags: [GED]
     *     summary: POST /test
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/test', [Authenticate, AuthInstitution], StorageConfigController.testConnection)
      /**
     * @openapi
     * /locations:
     *   get:
     *     tags: [GED]
     *     summary: GET /locations
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/locations', [Authenticate], StorageConfigController.listLocations)

export default router;
