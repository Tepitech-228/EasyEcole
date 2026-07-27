import express from 'express';
import Authenticate from '../../../core/middlewares/Authenticate';
import { AuthInstitution } from '../../../core/middlewares/AuthInstitution';
import { AuthAdmin } from '../../../core/middlewares/AuthAdmin';
import DomainController from '../controllers/DomainController';
import DocumentTypeController from '../controllers/DocumentTypeController';
import DisposalController from '../controllers/DisposalController';
import RolePermissionController from '../controllers/RolePermissionController';
import IntegrityController from '../controllers/IntegrityController';

const router = express.Router();

router
      /**
     * @openapi
     * /confidentiality-roles:
     *   get:
     *     tags: [GED]
     *     summary: GET /confidentiality-roles
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/confidentiality-roles', [Authenticate, AuthAdmin], RolePermissionController.list)
      /**
     * @openapi
     * /confidentiality-roles:
     *   put:
     *     tags: [GED]
     *     summary: PUT /confidentiality-roles
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/confidentiality-roles', [Authenticate, AuthAdmin], RolePermissionController.update)
      /**
     * @openapi
     * /confidentiality-roles/defaults:
     *   get:
     *     tags: [GED]
     *     summary: GET /confidentiality-roles/defaults
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/confidentiality-roles/defaults', [Authenticate, AuthAdmin], RolePermissionController.getDefaults)
      /**
     * @openapi
     * /permissions:
     *   get:
     *     tags: [GED]
     *     summary: GET /permissions
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/permissions', [Authenticate, AuthAdmin], RolePermissionController.list)
      /**
     * @openapi
     * /permissions:
     *   put:
     *     tags: [GED]
     *     summary: PUT /permissions
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/permissions', [Authenticate, AuthAdmin], RolePermissionController.update)
      /**
     * @openapi
     * /permissions/defaults:
     *   post:
     *     tags: [GED]
     *     summary: POST /permissions/defaults
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/permissions/defaults', [Authenticate, AuthAdmin], RolePermissionController.restoreDefaults)
      /**
     * @openapi
     * /disposal:
     *   get:
     *     tags: [GED]
     *     summary: GET /disposal
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/disposal', [Authenticate, AuthAdmin], DisposalController.list)
      /**
     * @openapi
     * /disposal/:id/reject:
     *   post:
     *     tags: [GED]
     *     summary: POST /disposal/:id/reject
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/disposal/:id/reject', [Authenticate, AuthAdmin], DisposalController.reject)
      /**
     * @openapi
     * /domains:
     *   get:
     *     tags: [GED]
     *     summary: GET /domains
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/domains', [Authenticate], DomainController.list)
      /**
     * @openapi
     * /domains/:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /domains/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/domains/:id', [Authenticate], DomainController.get)

      /**
     * @openapi
     * /domains:
     *   post:
     *     tags: [GED]
     *     summary: POST /domains
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/domains', [Authenticate, AuthInstitution], DomainController.create)
      /**
     * @openapi
     * /domains/:id:
     *   put:
     *     tags: [GED]
     *     summary: PUT /domains/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/domains/:id', [Authenticate, AuthInstitution], DomainController.update)
      /**
     * @openapi
     * /domains/:id:
     *   delete:
     *     tags: [GED]
     *     summary: DELETE /domains/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/domains/:id', [Authenticate, AuthAdmin], DomainController.remove)
      /**
     * @openapi
     * /document-types:
     *   get:
     *     tags: [GED]
     *     summary: GET /document-types
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/document-types', [Authenticate], DocumentTypeController.list)
      /**
     * @openapi
     * /document-types/:id:
     *   get:
     *     tags: [GED]
     *     summary: GET /document-types/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/document-types/:id', [Authenticate], DocumentTypeController.get)
      /**
     * @openapi
     * /document-types:
     *   post:
     *     tags: [GED]
     *     summary: POST /document-types
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/document-types', [Authenticate, AuthInstitution], DocumentTypeController.create)
      /**
     * @openapi
     * /document-types/:id:
     *   put:
     *     tags: [GED]
     *     summary: PUT /document-types/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.put('/document-types/:id', [Authenticate, AuthInstitution], DocumentTypeController.update)
      /**
     * @openapi
     * /document-types/:id:
     *   delete:
     *     tags: [GED]
     *     summary: DELETE /document-types/:id
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.delete('/document-types/:id', [Authenticate, AuthAdmin], DocumentTypeController.remove)

  // Integrity
      /**
     * @openapi
     * /verify-all:
     *   post:
     *     tags: [GED]
     *     summary: POST /verify-all
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/verify-all', [Authenticate, AuthAdmin], IntegrityController.verifyAll)

  // Backups
      /**
     * @openapi
     * /backup:
     *   post:
     *     tags: [GED]
     *     summary: POST /backup
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/backup', [Authenticate, AuthAdmin], IntegrityController.backup)
      /**
     * @openapi
     * /backups:
     *   get:
     *     tags: [GED]
     *     summary: GET /backups
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.get('/backups', [Authenticate, AuthAdmin], IntegrityController.listBackups)
      /**
     * @openapi
     * /backups/:id/restore:
     *   post:
     *     tags: [GED]
     *     summary: POST /backups/:id/restore
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/backups/:id/restore', [Authenticate, AuthAdmin], IntegrityController.restoreBackup)

export default router;
