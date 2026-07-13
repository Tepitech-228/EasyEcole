import express from 'express';
import FolderController from '../controllers/FolderController';
import Authenticate from '../../../core/middlewares/Authenticate';
import { AuthInstitution } from '../../../core/middlewares/AuthInstitution';

const router = express.Router();

router
  .get('/', [Authenticate], FolderController.list)
  .post('/', [Authenticate, AuthInstitution], FolderController.create)
  .put('/:id', [Authenticate, AuthInstitution], FolderController.update)
  .delete('/:id', [Authenticate, AuthInstitution], FolderController.remove)

export default router;
